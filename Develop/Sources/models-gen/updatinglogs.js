/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('updatinglogs', { 
    logid: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    orderid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    storeid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipperid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ordertypeid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pickupaddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryaddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pickupdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliverydate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recipientphone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recipientname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ledgerid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    statusid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    goods: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stockid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fee: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    cod: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    updatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updater: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
};
