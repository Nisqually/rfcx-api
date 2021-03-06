'use strict';
module.exports = function(sequelize, DataTypes) {
  var GuardianMetaOffline = sequelize.define('GuardianMetaOffline', {
    ended_at: {
      type: DataTypes.DATE(3),
      validate: {
        isDate: true
      }
    },
    offline_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true
      }
    },
    carrier_name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        GuardianMetaOffline.belongsTo(models.Guardian, {as: 'Guardian'});
      }
    },
    tableName: "GuardianMetaOffline"
  });
  return GuardianMetaOffline;
};