var util = require("util");
var Promise = require("bluebird");
var models  = require("../../models");

exports.guardianStatus = {

  audioCoverage: function(guardianId, intervalInHours) {
    return new Promise(function(resolve, reject) {

        var dbWhere = { guardian_id: guardianId, measured_at: {} };
        dbWhere.measured_at["$lt"] = new Date();
        dbWhere.measured_at["$gt"] = new Date(new Date()).valueOf()-(parseInt(intervalInHours)*3600000);

        try {

            models.GuardianAudio
              .findOne({
                where: dbWhere,
                attributes: [
//                        [ models.sequelize.fn("COUNT", models.sequelize.col("duration")), "duration_cnt" ],
                    [ models.sequelize.fn("SUM", models.sequelize.col("duration")), "duration_sum" ]
                ]
              }).then(function(dbStatus){

                resolve(Math.round(10000*parseInt(dbStatus.dataValues.duration_sum)/(parseInt(intervalInHours)*3600000))/10000);

              }).catch(function(err){
                console.log(err);
                reject(new Error(err));
              });

        } catch(err) {
            console.log(err);
            reject(new Error(err));
        }
    }.bind(this));
  }


};


