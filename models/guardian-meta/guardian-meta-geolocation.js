'use strict';
module.exports = function(sequelize, DataTypes) {
  var GuardianMetaGeoLocation = sequelize.define('GuardianMetaGeoLocation', {
    measured_at: {
      type: DataTypes.DATE(3),
      validate: {
        isDate: true
      }
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        isFloat: true,
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        isFloat: true,
        min: -180,
        max: 180
      }
    },
    precision: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        isFloat: true,
        min: 0
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        GuardianMetaGeoLocation.belongsTo(models.Guardian, {as: 'Guardian'});
      }
    },
    tableName: "GuardianMetaGeoLocations"
  });
  return GuardianMetaGeoLocation;
};