'use strict';
module.exports = function(sequelize, DataTypes) {
  var GuardianMetaDiskUsage = sequelize.define('GuardianMetaDiskUsage', {
    measured_at: {
      type: DataTypes.DATE(3),
      validate: {
        isDate: true
      }
    },
    internal_bytes_available: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    internal_bytes_used: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    external_bytes_available: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    external_bytes_used: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        GuardianMetaDiskUsage.belongsTo(models.Guardian, {as: 'Guardian'});
      }
    },
    tableName: "GuardianMetaDiskUsage"
  });
  return GuardianMetaDiskUsage;
};