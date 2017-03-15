var models  = require("../../../models");
var express = require("express");
var router = express.Router();
var hash = require("../../../utils/misc/hash.js").hash;
var views = require("../../../views/v1");
var httpError = require("../../../utils/http-errors.js");
var passport = require("passport");
passport.use(require("../../../middleware/passport-token").TokenStrategy);
var PerceptionsAiService = require("../../../services/perceptions/perceptions-ai-service");
var ValidationError = require("../../../utils/converter/validation-error");

router.route("/ai")
  .post(passport.authenticate("token",{session:false}), (req, res) => {

    var dBParams = {

      minimal_detected_windows: req.body.minimal_detected_windows,
      minimal_detection_confidence: req.body.minimal_detection_confidence,
      shortname: req.body.shortname,
      event_type: req.body.event_type,
      event_value: req.body.event_value
    };

    var uploadParams = {
      file: req.files.ai.path
    };

    var resultAi = null;

    PerceptionsAiService.createAiDb(dBParams)
      .then(ai => {uploadParams.guid=ai.guid; resultAi = ai})
      .then(() => {return PerceptionsAiService.uploadAi(uploadParams)})
      .then(() => res.status(200).json({success: true, shortname: resultAi.shortname, ai_guid: resultAi.guid, minimal_detection_confidence: resultAi.minimal_detection_confidence, minimal_detected_windows: resultAi.minimal_detected_windows}))
      .catch(ValidationError, e => httpError(res, 400, null, e.message))
      // catch-all for any other that is not based on user input
      .catch(e => httpError(res, 500, e, "Sensations couldn't be created."));

  });
module.exports = router;
