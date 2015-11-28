var verbose_logging = (process.env.NODE_ENV !== "production");
var models  = require("../../models");
var express = require("express");
var router = express.Router();
var views = require("../../views/v1");
var passport = require("passport");
var aws = require("../../utils/external/aws.js").aws();
var ffmpeg = require("fluent-ffmpeg")
var path = require("path")
var fs = require('fs')
passport.use(require("../../middleware/passport-token").TokenStrategy);

router.route("/:event_id")
    //  .get(passport.authenticate("token",{session:false}), function(req,res) {
    .get(function(req,res) {

        var event_guid = '7461363d-ee8f-4054-971f-9195203680fa';
        models.GuardianEvent
            .findOne({
                where: { guid: event_guid },
                include: [{ all: true }]
            }).then(function(dbEvent){

                var dbRow = dbEvent.Audio,
                    s3NoProtocol = dbRow.url.substr(dbRow.url.indexOf("://")+3)
                    ,s3Bucket = s3NoProtocol.substr(0,s3NoProtocol.indexOf("/"))
                    ,s3Path = s3NoProtocol.substr(s3NoProtocol.indexOf("/"))
                    ,s3Key = s3Path.substr(1+s3Path.indexOf("/"))
                    ,offset = (dbEvent.measured_at - dbEvent.Audio.measured_at) / 1000
                    ,audio_guid = dbEvent.Audio.guid
                    //audioFileExtension = s3Path.substr(1+s3Path.lastIndexOf(".")),
                    //audioContentType = "audio/mp4"
                    ;

                //
                // CODE FOR TRIALING PIPING FILE STREAM DIRECTLY TO BROWSER
                //
                //var AWS = require('aws-sdk');
                //
                //var s3 = new AWS.S3({
                //    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                //    secretAccessKey: process.env.AWS_SECRET_KEY,
                //    region: process.env.AWS_REGION_ID
                //});
                //var fileStream = s3.getObject({
                //        Bucket: s3Bucket,
                //        Key: "development/test/re_muxed.m4a"
                //    }).createReadStream();
                //aws.s3(s3Bucket).getFile(s3Path, function(err, result) {
                //    var proc = new ffmpeg(result)
                //        .withAudioCodec('copy')
                //        .format('mp4')
                //        .outputOptions(['-movflags isml+frag_keyframe'])
                //        .on('error', function (err, stdout, stderr) {
                //            console.log('an error happened: ' + err.message);
                //            console.log('ffmpeg stdout: ' + stdout);
                //            console.log('ffmpeg stderr: ' + stderr);
                //        })
                //        .on('end', function () {
                //            console.log('Processing finished !');
                //        })
                //        .on('progress', function (progress) {
                //            console.log('Processing: ' + progress.percent + '% done');
                //        })
                //        .pipe(res, {end: true});
                //});



                //test.m4a
                //var infs = fs.createReadStream('/Users/brettanderson/Documents/software_projects/rfcx-api/public/01 - Electronic Performers.mp3');
                //
                //infs.on('error', function(err) {
                //    console.log(err);
                //});
                var file_location = '/Users/brettanderson/Documents/software_projects/rfcx-api/tmp/stream/' + audio_guid + '.m4a';


                aws.s3(s3Bucket).getFile(s3Path, function(err, result){
                    result.pipe(fs.createWriteStream(file_location));
                    result.on('end', function() {
                        console.log('File Downloaded!');
                        var proc = new ffmpeg(file_location)
                            .outputOptions(['-movflags isml+frag_keyframe'])
                            .toFormat('mp4')
                            .withAudioCodec('copy')
                            //.seekInput(offset)
                            .on('error', function(err,stdout,stderr) {
                                console.log('an error happened: ' + err.message);
                                console.log('ffmpeg stdout: ' + stdout);
                                console.log('ffmpeg stderr: ' + stderr);
                            })
                            .on('end', function() {
                                console.log('Processing finished !');
                            })
                            .on('progress', function(progress) {
                                console.log('Processing: ' + progress.percent + '% done');
                            })
                            .pipe(res, {end: true});
                    });
                });

                ////aws.s3(s3Bucket).getFile(s3Path, function(err, result){
                ////    if(err) { return next(err); }
                //    var proc = new ffmpeg(fileStream)
                //        //.seekInput(5)
                //        //.withAudioBitrate('128k')
                //        .withAudioCodec('libmp3lame')
                //        .format('mp3')
                //        .on('error', function(err,stdout,stderr) {
                //            console.log('an error happened: ' + err.message);
                //            console.log('ffmpeg stdout: ' + stdout);
                //            console.log('ffmpeg stderr: ' + stderr);
                //        })
                //        .on('end', function() {
                //            console.log('Processing finished !');
                //        })
                //        .on('progress', function(progress) {
                //            console.log('Processing: ' + progress.percent + '% done');
                //        })
                //        .pipe(res, {end: true});
                ////});

                //if (req.rfcx.content_type === "m4a") {
                //    views.models.guardianAudioFile(req,res,dbEvent.Audio);
                //} else {
                //    res.status(200).json(views.models.guardianAudio(req,res,dbEvent.Audio));
                //}

            }).catch(function(err){
                console.log("failed to return audio | "+err);
                if (!!err) { res.status(500).json({msg:"failed to return audio"}); }
            });
    });

//router.route("/:event_id")
//    //  .get(passport.authenticate("token",{session:false}), function(req,res) {
//    .get(function(req,res) {
//
//        models.GuardianEvent
//            .findOne({
//                where: { guid: req.params.event_id },
//                include: [{ all: true }]
//            }).then(function(dbEvent){
//
//                var dbRow = dbEvent.Audio,
//                    s3NoProtocol = dbRow.url.substr(dbRow.url.indexOf("://")+3),
//                    s3Bucket = s3NoProtocol.substr(0,s3NoProtocol.indexOf("/")),
//                    s3Path = s3NoProtocol.substr(s3NoProtocol.indexOf("/")),
//                    audioFileExtension = s3Path.substr(1+s3Path.lastIndexOf(".")),
//                    audioContentType = "audio/mp4"
//                    ;
//
//                aws.s3(s3Bucket).getFile(s3Path, function(err, result){
//                    if(err) { return next(err); }
//                    res.contentType('flv');
//                    //res.setHeader("Content-disposition", "filename="+dbRow.guid+"."+audioFileExtension);
//                    //res.setHeader("Content-type", audioContentType);
//                    var proc = new ffmpeg(result)
//                        //.seekInput(5)
//                        //.withVideoBitrate(1024)
//                        //.withVideoCodec('libx264')
//                        //.withAspect('16:9')
//                        //.withFps(24)
//                        //.withAudioBitrate('128k')
//                        .withAudioCodec('libmp3lame')
//                        .format('mp3')
//                        .on('error', function(err,stdout,stderr) {
//                            console.log('an error happened: ' + err.message);
//                            console.log('ffmpeg stdout: ' + stdout);
//                            console.log('ffmpeg stderr: ' + stderr);
//                        })
//                        .on('end', function() {
//                            console.log('Processing finished !');
//                        })
//                        .on('progress', function(progress) {
//                            console.log('Processing: ' + progress.percent + '% done');
//                        })
//                        .pipe(res, {end: true});
//                });
//
//                //if (req.rfcx.content_type === "m4a") {
//                //    views.models.guardianAudioFile(req,res,dbEvent.Audio);
//                //} else {
//                //    res.status(200).json(views.models.guardianAudio(req,res,dbEvent.Audio));
//                //}
//
//            }).catch(function(err){
//                console.log("failed to return audio | "+err);
//                if (!!err) { res.status(500).json({msg:"failed to return audio"}); }
//            });
//
//    });


module.exports = router;