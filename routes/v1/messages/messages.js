// var verbose_logging = (process.env.NODE_ENV !== "production");
var express = require("express");
var router = express.Router();
var views = require("../../../views/v1");
var passport = require("passport");
passport.use(require("../../../middleware/passport-token").TokenStrategy);
var requireUser = require("../../../middleware/authorization/authorization").requireTokenType("user");
var httpError = require("../../../utils/http-errors");
// var sensationsService = require("../../../services/sensations/sensations-service");
var ValidationError = require("../../../utils/converter/validation-error");
var usersService = require('../../../services/users/users-service');
var messagesService = require('../../../services/messages/messages-service');
var sequelize = require("sequelize");

router.route("/")
  .post(passport.authenticate("token", {session: false}), requireUser, function (req, res) {

    // map HTTP params to service params
    var serviceParams = {
      text: req.body.text,
      time: req.body.time,
      // type: req.body.type,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    };

    usersService.getUserByGuid(req.rfcx.auth_token_info.guid)
      .then((userFrom) => {
        serviceParams.from_user = userFrom.id;
        if (req.body.userTo) {
          return usersService.getUserByGuid(req.body.userTo);
        }
        return null;
      })
      .then((userTo) => {
        if (userTo) {
          serviceParams.to_user = userTo.id;
        }
        return messagesService.getTypeByName(req.body.type)
      })
      .then((type) => {
        serviceParams.type = type.id;
        return messagesService.createMessage(serviceParams);
      })
      .then((message) => {
        return messagesService.formatMessage(message);
      })
      .then(result => res.status(200).json(result))
      .catch(sequelize.EmptyResultError, e => httpError(res, 404, null, e.message))
      .catch(ValidationError, e => httpError(res, 400, null, e.message))
      .catch(e => { console.log('e', e); httpError(res, 500, e, "Message couldn't be created.")});
  });

module.exports = router;