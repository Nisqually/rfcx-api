"use strict";

module.exports = function(sequelize, DataTypes) {
  var GuardianSoftwareVersion = sequelize.define("GuardianSoftwareVersion", {
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
      }
    },
    release_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: true
      }
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      validate: {
      }
    },
    sha1_checksum: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    tableName: "GuardianSoftwareVersions"
  });

  return GuardianSoftwareVersion;
};
