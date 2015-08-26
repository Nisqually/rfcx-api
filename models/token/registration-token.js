"use strict";

module.exports = function(sequelize, DataTypes) {
  var RegistrationToken = sequelize.define("RegistrationToken", {
    guid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
   //     len: [4,6]
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
      }
    },
    only_allow_access_to: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
      }
    },
    allowed_redemptions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: true,
        min: 1
      }
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
      }
    },
    created_for: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
      }
    },
    auth_token_salt: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
      }
    },
    auth_token_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
      }
    },
    auth_token_expires_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: true
      }
    },
  }, {
    classMethods: {
      associate: function(models) {
      },
      indexes: [
        {
          unique: true,
          fields: ["guid"]
        }
      ]
    }
  });

  return RegistrationToken;
};
