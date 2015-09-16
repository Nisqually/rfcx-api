var verbose_logging = (process.env.NODE_ENV !== "production");
var models  = require("../../models");
var express = require("express");
var router = express.Router();
var views = require("../../views/v1");
var passport = require("passport");
passport.use(require("../../middleware/passport-token").TokenStrategy);

router.route("/:site_id/guardians")
  .get(passport.authenticate("token",{session:false}), function(req,res) {

    models.GuardianSite
      .findOne({ 
        where: { guid: req.params.site_id }
      }).then(function(dbSite){

        var dbQuery = { site_id: dbSite.id };

        models.Guardian
          .findAll({ 
            where: dbQuery, 
            include: [ { all: true } ], 
            order: [ ["last_check_in", "DESC"] ],
            limit: req.rfcx.limit,
            offset: req.rfcx.offset
          }).then(function(dbGuardian){
            
            res.status(200).json(views.models.guardian(req,res,dbGuardian));

          }).catch(function(err){
            console.log("failed to return guardians | "+err);
            if (!!err) { res.status(500).json({msg:"failed to return guardians"}); }
          });

      }).catch(function(err){
        console.log("failed to return site | "+err);
        if (!!err) { res.status(500).json({msg:"failed to return site"}); }
      });

  })
;



module.exports = router;



