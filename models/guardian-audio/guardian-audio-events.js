"use strict";

module.exports = function(sequelize, DataTypes) {
  var GuardianAudioEvent = sequelize.define("GuardianAudioEvent", {
    guid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0.0,
        max: 1.0
      }
    },
    windows: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: function(models) {
        GuardianAudioEvent.belongsTo(models.GuardianAudio, { as: 'Audio', foreignKey: "audio_id" });
        GuardianAudioEvent.belongsTo(models.GuardianAudioEventType, { as: 'Type', foreignKey: "type" });
        GuardianAudioEvent.belongsTo(models.GuardianAudioEventValue, { as: 'Value', foreignKey: "value" });
      },
      indexes: [
        {
          unique: true,
          fields: ["guid"]
        }
      ]
    },
    tableName: "GuardianAudioEvents"
  });

  return GuardianAudioEvent;
};
