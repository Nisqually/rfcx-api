var verbose_logging = (process.env.NODE_ENV !== "production");
var models  = require("../../../models");
var express = require("express");
var router = express.Router();
var util = require("util");
var views = require("../../../views/v1");
var httpError = require("../../../utils/http-errors.js");
var assetUtils = require("../../../utils/internal-rfcx/asset-utils.js").assetUtils;
var passport = require("passport");
passport.use(require("../../../middleware/passport-token").TokenStrategy);

var analysisUtils = require("../../../utils/rfcx-analysis/analysis-queue.js").analysisUtils;

router.route("/:guardian_id/audio/analysis")
  .post(passport.authenticate("token",{session:false}), function(req,res) {

    models.Guardian
      .findOne({ 
        where: { guid: req.params.guardian_id }
      }).then(function(dbGuardian){

        var dbQueryOrder = (req.rfcx.order != null) ? req.rfcx.order : "DESC";

        var dbQuery = { guardian_id: dbGuardian.id };
        var dateClmn = "measured_at";
        if ((req.rfcx.ending_before != null) || (req.rfcx.starting_after != null)) { dbQuery[dateClmn] = {}; }
        if (req.rfcx.ending_before != null) { dbQuery[dateClmn]["$lt"] = req.rfcx.ending_before; }
        if (req.rfcx.starting_after != null) { dbQuery[dateClmn]["$gt"] = req.rfcx.starting_after; }


        var modelGuid = req.query.model_id;
        var audioGuids = [];
        return models.GuardianAudio
          .findAll({ 
            where: dbQuery, 
            include: [ { all: true } ], 
            order: [ [dateClmn, dbQueryOrder] ],
            limit: 14000,//req.rfcx.limit,
            offset: req.rfcx.offset
          }).then(function(dbAudio){

            if (dbAudio.length < 1) {
              httpError(res, 404, "database");
            } else {



              if (!util.isArray(dbAudio)) { dbAudio = [dbAudio]; }
              var batch = [];
              for (i in dbAudio) {

                  batch.push({
                  audio_guid: dbAudio[i].guid,
                  api_url_domain: req.rfcx.api_url_domain,
                  audio_sha1_checksum: dbAudio[i].sha1_checksum,
                  audio_s3_bucket: process.env.ASSET_BUCKET_AUDIO,
                  audio_s3_path: 
                    // auto-generate the asset filepath if it's not stored in the url column
                    (dbAudio[i].url == null)
                      ? assetUtils.getGuardianAssetStoragePath("audio",dbAudio[i].measured_at,dbGuardian.guid,dbAudio[i].Format.file_extension)
                      : dbAudio[i].url.substr(dbAudio[i].url.indexOf("://")+3+process.env.ASSET_BUCKET_AUDIO.length),
                  
                });

                audioGuids.push(dbAudio[i].guid);
              }

              return analysisUtils.batchQueueAudioForAnalysis(process.env.SQS_PERCEPTION_BATCH, modelGuid, batch);
            }

        }).then(function () {
          res.status(200).json(audioGuids);
        }).catch(function(err){
          console.log("failed to requeue audio | "+err);
          if (!!err) { res.status(500).json({msg:"failed to requeue audio"}); }
        });

      }).catch(function(err){
        console.log("failed to find guardian | "+err);
        if (!!err) { res.status(500).json({msg:"failed to find guardian"}); }
      });

  })
;



module.exports = router;



