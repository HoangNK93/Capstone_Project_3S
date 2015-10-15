/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('storemanagers', { 
    managerid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    identitycard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phonenumber: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
};
