'use strict';
module.exports = function(sequelize, DataTypes) {
  var GuardianMetaDataTransfer = sequelize.define('GuardianMetaDataTransfer', {
    started_at: {
      type: DataTypes.DATE(3),
      validate: {
        isDate: true
      }
    },
    ended_at: {
      type: DataTypes.DATE(3),
      validate: {
        isDate: true
      }
    },
    bytes_received: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 0
      }
    },
    bytes_sent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 0
      }
    },
    total_bytes_received: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 0
      }
    },
    total_bytes_sent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 0
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        GuardianMetaDataTransfer.belongsTo(models.Guardian, {as: 'Guardian'});
      }
    },
    tableName: "GuardianMetaDataTransfer"
  });
  return GuardianMetaDataTransfer;
};