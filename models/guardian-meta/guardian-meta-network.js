'use strict';
module.exports = function(sequelize, DataTypes) {
  var GuardianMetaNetwork = sequelize.define('GuardianMetaNetwork', {
    measured_at: {
      type: DataTypes.DATE(3),
      validate: {
        isDate: true
      }
    },
    signal_strength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true
      }
    },
    network_type: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
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
        GuardianMetaNetwork.belongsTo(models.Guardian, {as: 'Guardian'});
      }
    },
    tableName: "GuardianMetaNetwork"
  });
  return GuardianMetaNetwork;
};