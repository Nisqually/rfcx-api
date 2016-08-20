var util = require("util");
var Promise = require("bluebird");
var models  = require("../../models");
var fs = require("fs");
var zlib = require("zlib");
var hash = require("../../utils/misc/hash.js").hash;
var token = require("../../utils/internal-rfcx/token.js").token;
var aws = require("../../utils/external/aws.js").aws();
var exec = require("child_process").exec;
var audioUtils = require("../../utils/rfcx-audio").audioUtils;
var analysisUtils = require("../../utils/rfcx-analysis/analysis-queue.js").analysisUtils;

var cachedFiles = require("../../utils/internal-rfcx/cached-files.js").cachedFiles;

exports.audio = {

  info: function(audioFiles, apiUrlDomain, audioMeta, dbGuardian, dbCheckIn) {

    // REMOVE LATER
    // cached file garbage collection... 
    if (Math.random() < 0.01 ? true : false) { // only do garbage collection ~1% of the time it's allowed
      cachedFiles.cacheDirectoryGarbageCollection();
    }

    var audioInfo = {};

    if (!!audioFiles) {

      // make sure the screenshot files is an array
      if (!util.isArray(audioFiles)) { audioFiles = [audioFiles]; }
        
      if (audioMeta.length == audioFiles.length) {

        for (i in audioFiles) {

          var timeStamp = audioMeta[i][1]; 
          var dateString = (new Date(parseInt(timeStamp))).toISOString().substr(0,19).replace(/:/g,"-");

          audioInfo[timeStamp] = {

            guardian_id: dbGuardian.id,
            guardian_guid: dbGuardian.guid,
            checkin_id: dbCheckIn.id,
            checkin_guid: dbCheckIn.guid,
            site_id: dbGuardian.site_id,

            uploadLocalPath: audioFiles[i].path,
            unzipLocalPath: audioFiles[i].path.substr(0,audioFiles[i].path.lastIndexOf("."))+"."+audioMeta[i][2],
            wavAudioLocalPath: audioFiles[i].path.substr(0,audioFiles[i].path.lastIndexOf("."))+".wav",
            
            guardianSha1Hash: audioMeta[i][3],
            sha1Hash: null, // to be calculated following the uncompression
            size: null, // to be calculated following the uncompression

            dbAudioObj: null,
            audio_id: null,
            audio_guid: null,
            
            capture_format: null,
            capture_bitrate: (audioMeta[i][5] != null) ? parseInt(audioMeta[i][5]) : null,
            capture_sample_rate: (audioMeta[i][4] != null) ? parseInt(audioMeta[i][4]) : null,
            capture_sample_count: null,
            capture_encode_duration: (audioMeta[i][8] != null) ? parseInt(audioMeta[i][8]) : null,
            capture_file_extension: audioMeta[i][2],
            capture_codec: audioMeta[i][6],
            capture_is_vbr: (audioMeta[i][7].toLowerCase() === "vbr"),

            timeStamp: timeStamp,
            measured_at: new Date(parseInt(timeStamp)),
            api_token_guid: null,
            api_token: null,
            api_token_expires_at: null,
            api_url: null,
            api_url_domain: apiUrlDomain,
            isSaved: { db: false, s3: false, sqs: false },
            s3Path: "/"+dateString.substr(0,7)+"/"+dateString.substr(8,2)+"/"+dbGuardian.guid+"/"
                   +dbGuardian.guid+"-"+dateString+"."+audioMeta[i][2]
          };
          
        }

      } else {
        console.log("couldn't match audio meta to uploaded content | "+audioMeta);
      }

    }
    return audioInfo;
  },

  processUpload: function(audioInfo) {
    return new Promise(function(resolve, reject) {
        try {

          // unzip uploaded audio file into upload directory
          audioInfo.unZipStream = fs.createWriteStream(audioInfo.unzipLocalPath);
          fs.createReadStream(audioInfo.uploadLocalPath).pipe(zlib.createGunzip()).pipe(audioInfo.unZipStream);
          // when the output stream closes, proceed asynchronously...
          audioInfo.unZipStream.on("close", function(){

            // calculate checksum of unzipped file
            audioInfo.sha1Hash = hash.fileSha1(audioInfo.unzipLocalPath);
            // compare to checksum received from guardian
            if (audioInfo.sha1Hash === audioInfo.guardianSha1Hash) {  

              resolve(audioInfo);

            } else {
              console.log("checksum mismatch on uploaded (and unzipped) audio file | "+audioInfo.sha1Hash + " - " + audioInfo.guardianSha1Hash);
              reject(new Error(err));
            }

          });

        } catch(err) {
            console.log(err);
            reject(new Error(err));
        }
    }.bind(this));
  },

  extractAudioFileMeta: function(audioInfo) {
      try {
        fs.stat(audioInfo.unzipLocalPath, function(statErr,fileStat){
          if (statErr == null) {

            audioInfo.size = fileStat.size;
            audioInfo.dbAudioObj.size = audioInfo.size;
            audioInfo.dbAudioObj.save();

            audioUtils.transcodeToFile( "wav", {
                sourceFilePath: audioInfo.unzipLocalPath,
                sampleRate: audioInfo.capture_sample_rate
            }).then(function(wavFilePath){

              fs.stat(wavFilePath, function(wavStatErr,wavFileStat){
                if (wavStatErr == null) {
                  audioInfo.wavAudioLocalPath = wavFilePath;
                  exec(process.env.SOX_PATH+"i -s "+audioInfo.wavAudioLocalPath, function(err,stdout,stderr){
                    if (stderr.trim().length > 0) { console.log(stderr); }
                    if (!!err) { console.log(err); }

                    audioInfo.dbAudioObj.capture_sample_count = parseInt(stdout.trim());
                    audioInfo.dbAudioObj.save();

                    cleanupCheckInFiles(audioInfo);

                  });
                }
              });
            }).catch(function(err){
              console.log(err);
              cleanupCheckInFiles(audioInfo);
            });
          }
        });
      } catch(err) {
          console.log(err);
          cleanupCheckInFiles(audioInfo);
      }
  },

  saveToDb: function(audioInfo) {
    return new Promise(function(resolve, reject) {

      models.GuardianAudio.create({
        guardian_id: audioInfo.guardian_id,
        site_id: audioInfo.site_id,
        check_in_id: audioInfo.checkin_id,
        sha1_checksum: audioInfo.sha1Hash,
        url: "s3://"+process.env.ASSET_BUCKET_AUDIO+audioInfo.s3Path,
        capture_bitrate: audioInfo.capture_bitrate,
        encode_duration: audioInfo.capture_encode_duration,
        measured_at: audioInfo.measured_at
      }).then(function(dbAudio){

        models.GuardianAudioFormat
          .findOrCreate({
            where: {
              codec: audioInfo.capture_codec,
              mime: mimeTypeFromAudioCodec(audioInfo.capture_codec),
              file_extension: audioInfo.capture_file_extension,
              sample_rate: audioInfo.capture_sample_rate,
              target_bit_rate: audioInfo.capture_bitrate,
              is_vbr: audioInfo.capture_is_vbr
            }
          }).spread(function(dbAudioFormat, wasCreated){
            
            dbAudio.format_id = dbAudioFormat.id;
            dbAudio.save();

            audioInfo.isSaved.db = true;
            audioInfo.dbAudioObj = dbAudio;
            audioInfo.audio_id = dbAudio.id;
            audioInfo.audio_guid = dbAudio.guid;

            resolve(audioInfo);

          }).catch(function(err){ 
            console.log("error linking audio format to audio entry to database | "+err);
            reject(new Error(err));
          });

      }).catch(function(err){
        console.log("error adding audio to database | "+err);
        reject(new Error(err));
      });     
    }.bind(this));
  },

  saveToS3: function(audioInfo) {
    return new Promise(function(resolve, reject) {

      aws.s3(process.env.ASSET_BUCKET_AUDIO)
        .putFile(
          audioInfo.unzipLocalPath, 
          audioInfo.s3Path, 
          function(err, s3Res){
            try { s3Res.resume(); } catch (resumeErr) { console.log(resumeErr); }
            if (!!err) {
              console.log(err);
              reject(new Error(err));
            } else if ((200 == s3Res.statusCode) && aws.s3ConfirmSave(s3Res,audioInfo.s3Path)) {
              
              audioInfo.isSaved.s3 = true;
              
              resolve(audioInfo);

            } else {
              reject(new Error("audio file could not be successfully saved"));
            }
      });

    }.bind(this));
  },

  queueForAnalysis: function(audioInfo) {
    return new Promise(function(resolve, reject) {

      var modelGuid = "b6db4c8d-16b4-4400-bcbf-1e4f4938dede";

      analysisUtils.queueAudioForAnalysis("rfcx-analysis", "v3", modelGuid, {
        audio_guid: audioInfo.audio_guid,
        api_url_domain: audioInfo.api_url_domain,
        audio_s3_bucket: process.env.ASSET_BUCKET_AUDIO,
        audio_s3_path: audioInfo.s3Path,
        audio_sha1_checksum: audioInfo.sha1Hash,
      }).then(function(){

        audioInfo.isSaved.sqs = true;
        resolve(audioInfo);

      }).catch(function(err){

        console.log(err);
        reject(err);

      });

      // audioInfo.api_url = "/v1/guardians/"+audioInfo.guardian_guid+"/checkins/"+audioInfo.checkin_guid+"/audio/"+audioInfo.audio_guid+"/events";

      // token.createAnonymousToken({
      //   reference_tag: audioInfo.audio_guid,
      //   token_type: "analysis",
      //   created_by: "checkin",
      //   minutes_until_expiration: 180,
      //   allow_garbage_collection: true,
      //   only_allow_access_to: [ "^"+audioInfo.api_url+"$" ]
      // }).then(function(tokenInfo){

      //   audioInfo.api_token_guid = tokenInfo.token_guid;
      //   audioInfo.api_token = tokenInfo.token;
      //   audioInfo.api_token_expires_at = tokenInfo.token_expires_at;
      //   audioInfo.minutes_until_expiration = Math.round((tokenInfo.token_expires_at.valueOf()-(new Date()).valueOf())/60000);

      //   audioInfo.analysis_method = "v3";
      //   audioInfo.analysis_model = "ab";
      //   audioInfo.analysis_sample_rate = 8000;

      //   aws.sns().publish({
      //       TopicArn: aws.snsTopicArn("rfcx-analysis"),
      //       Message: JSON.stringify({
                
      //           measured_at: audioInfo.measured_at.toISOString(),

      //           api_token_guid: audioInfo.api_token_guid,
      //           api_token: audioInfo.api_token,
      //           api_token_expires_at: audioInfo.api_token_expires_at,
      //           api_url: audioInfo.api_url_domain+audioInfo.api_url,
      //           audio_url: aws.s3SignedUrl(process.env.ASSET_BUCKET_AUDIO, audioInfo.s3Path, audioInfo.minutes_until_expiration),
      //           audio_sha1: audioInfo.sha1Hash,

      //           analysis_method: audioInfo.analysis_method,
      //           analysis_model: audioInfo.analysis_model,
      //           analysis_sample_rate: audioInfo.analysis_sample_rate
                
      //         })
      //     }, function(snsErr, snsData) {
      //       if (!!snsErr && !aws.snsIgnoreError()) {
      //         console.log(snsErr);
      //         reject(new Error(snsErr));
      //       } else {

      //         audioInfo.isSaved.sqs = true;

      //         audioInfo.dbAudioObj.analysis_queued_at = new Date();
      //         audioInfo.dbAudioObj.save();
              
      //         resolve(audioInfo);

      //       }
      //   });

      // }).catch(function(err){
      //   console.log("error creating access token for analysis worker | "+err);
      //   // dbCheckIn.destroy().then(function(){ console.log("deleted incomplete checkin entry"); }).catch(function(err){ console.log("failed to delete incomplete checkin entry | "+err); });
      //   // dbAudio.destroy().then(function(){ console.log("deleted incomplete checkin entry"); }).catch(function(err){ console.log("failed to delete incomplete checkin entry | "+err); });
      //   if (!!err) { res.status(500).json({msg:"error creating access token for analysis worker"}); }
      //   reject(new Error(err));
      // });

    }.bind(this));
  },

  rollBackCheckIn: function(audioInfo) {

    models.GuardianAudio.findOne({ where: { sha1_checksum: audioInfo.sha1Hash } }).then(function(dbAudio){ dbAudio.destroy().then(function(){ console.log("deleted incomplete audio entry"); }); }).catch(function(err){ console.log("failed to delete incomplete audio entry | "+err); });
    
    models.GuardianCheckIn.findOne({ where: { id: audioInfo.checkin_id } }).then(function(dbCheckIn){ dbCheckIn.destroy().then(function(){ console.log("deleted checkin entry"); }); }).catch(function(err){ console.log("failed to delete checkin entry | "+err); });
 
    cleanupCheckInFiles(audioInfo);
  }

};



var cleanupCheckInFiles = function(audioInfo) {

    fs.stat( audioInfo.uploadLocalPath, function(err, stat) {
      if (err == null) { fs.unlink( audioInfo.uploadLocalPath, function(e) { if (e) { console.log(e); } } ); }
    });

    fs.stat( audioInfo.unzipLocalPath, function(err, stat) {
      if (err == null) { fs.unlink( audioInfo.unzipLocalPath, function(e) { if (e) { console.log(e); } } ); }
    });

    fs.stat( audioInfo.wavAudioLocalPath, function(err, stat) {
      if (err == null) { fs.unlink( audioInfo.wavAudioLocalPath, function(e) { if (e) { console.log(e); } } ); }
    });

};

var mimeTypeFromAudioCodec = function(audioCodec) {

  if (audioCodec.toLowerCase() == "aac") {
    return "audio/mp4";
  } else if (audioCodec.toLowerCase() == "opus") {
    return "audio/ogg";
  } else if (audioCodec.toLowerCase() == "flac") {
    return "audio/flac";
  } else if (audioCodec.toLowerCase() == "mp3") {
    return "audio/mpeg";
  } else {
    return null;
  }

};

