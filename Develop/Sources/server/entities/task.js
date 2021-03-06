/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    var task = sequelize.define('task', {
        taskid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        orderid: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        shipperid: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        adminid: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        statusid: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        typeid: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        taskdate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        classMethods: {
            associate: function(db) {
                task.belongsTo(db.order, {
                    foreignKey: 'orderid',
                    constraints: false
                });

                task.belongsTo(db.tasktype, {
                    foreignKey: 'typeid',
                    constraints: false
                });

                task.belongsTo(db.taskstatus, {
                    foreignKey: 'statusid',
                    constraints: false
                });

                task.belongsTo(db.user,
                    {as:'assigner', foreignKey: 'adminid'}
                );
                task.belongsTo(db.user,
                    {as: 'shipper',foreignKey: 'shipperid'}
                );
            },
            getAllHistoryOfShipper: function (shipperid, page, modelOrder, modelOrderStatus) {
                var limitNum = (page > 0) ? 2 : 0;
                return task.findAll({
                    attributes: [['taskid', 'id'],['taskdate','date'],['statusid','taskstatus']],
                    order: [['taskdate','DESC']],
                    limit: limitNum,
                    offset: limitNum * (page - 1),
                    where: {
                        shipperid: shipperid,
                        statusid: {
                            $in: [3, 5]
                        }
                    },
                    include: [
                        {
                            model: modelOrder,
                            //limit: 1,
                            attributes: [['orderid', 'code'], 'statusid', 'fee', 'cod'],
                            include: {
                                model: modelOrderStatus,
                                attributes: [['statusname', 'statusid']]
                            }
                        }
                    ]
                });
            },

            //// START - count total task history of one shipper
            //// HuyTDH 10-11-2015
            countTotalTaskHistoryOfShipper: function(shipperid){
                return task.findOne({
                    attributes: [[sequelize.fn('COUNT', sequelize.col('taskid')), 'total']],
                    where: {
                        shipperid: shipperid,
                        statusid: {
                            $in: [3, 5]
                        }
                    }
                });
            },
            //// END - count total task history of one shipper

            getMapdataById: function (orderModel, shipperID, order){
                if(order=="all") {
                    return task.findAll({
                        attributes: ['orderid', ['shipperid', 'shipperID']],
                        where: {
                            shipperid: shipperID
                        },
                        include: {
                            model: orderModel,
                            attributes: [['storeid', 'storeID'], ['pickupaddresscoordination', 'storePos'], ['deliveryaddress', 'customerPos']]
                        }
                    });
                }else{
                    return task.findAll({
                        attributes: ['orderid', ['shipperid', 'shipperID']],
                        where: {
                            shipperid: shipperID,
                            orderid: order
                        },
                        include: {
                            model: orderModel,
                            attributes: [['storeid', 'storeID'], ['pickupaddresscoordination', 'storePos'], ['deliveryaddress', 'customerPos']]
                        }
                    });
                }
            },

            updateStatusOfTask: function (taskid, status) {
                return task.update({
                   'statusid': status,
                },{
                    where: {
                        'taskid': taskid
                    }
                })
            },
            updateShipperOfTask: function (taskid, shipperid) {
                            return task.update({
                               'shipperid': shipperid,
                            },{
                                where: {
                                    'taskid': taskid
                                }
                            })
                        },

            assignTaskForShipper: function(shipper){
                return task.findOrCreate({
                    where: {
                        orderid: shipper.orderid,
                        statusid: shipper.statusid,
                        typeid: shipper.typeid
                    },
                    defaults: {
                        adminid: shipper.adminid,
                        shipperid: shipper.shipperid,
                        taskdate: shipper.taskdate
                    }
                }).spread(function(tasks, created){

                    if (!created && tasks.shipperid != shipper.shipperid)
                        if (tasks.statusid == 4){
                            task.create({
                                    'orderid': shipper.orderid,
                                    'shipperid': shipper.shipperid,
                                    'adminid': shipper.adminid,
                                    'statusid': 2,
                                    'typeid': shipper.typeid,
                                    'taskdate': new Date(Date.now())
                                });
                            return task.updateStatusOfTask(tasks.taskid, 5);
                        }
                    else  return task.updateShipperOfTask(tasks.taskid, shipper.shipperid);
                })
            },

            createTaskForShipper: function(dataTask){
                return task.create({
                    'orderid': dataTask.orderid,
                    'shipperid': dataTask.shipperid,
                    'adminid': dataTask.adminid,
                    'statusid': dataTask.statusid,
                    'typeid': dataTask.typeid,
                    'taskdate': new Date(Date.now())
                }).then(function(task){
                    return task;
                })
            },

            getAllTask: function(user, order, orderstatus, taskstatus, tasktype, store, profile){
                return task.findAll({
                    include: [{
                        model: user,
                        as: 'assigner'
                    },{
                        model: user,
                        as: 'shipper',
                        include: [{model: profile,  attributes: ['name']}]
                    },{
                        model: order,
                        include: [{
                            model: orderstatus,  attributes: ['statusname']
                        },{
                            model: store,  attributes: ['name']
                        }]
                    },{
                        model: taskstatus,
                        attributes: ['statusid','statusname']
                    },{
                        model: tasktype,
                        attributes: ['typeid','typename']
                    }],
                    where:{
                        'shipperid': { $ne: null}
                    }
                })
            },

            countTaskByShipperId: function(shipperid, taskStatusModel){
                return task.findAll({
                    attributes: ['statusid', [sequelize.fn('count', sequelize.col('task.statusid')), 'count']],
                    group: ['task.statusid'],
                    where:{
                        shipperid: shipperid
                    },
                    //include: {
                    //    model: taskStatusModel,
                    //    attributes: ['statusname']
                    //}
                })
			},

            getAll: function () {
              return task.findAll();
            },

            updateTaskState: function (newTask) {//especially for task list
                return task.update(
                    {'statusid': newTask.selectedStatus.statusid, 'typeid': newTask.selectedType.typeid },
                    {
                        where: {
                            'taskid': newTask.taskid
                        }
                    })
            },

            updateTaskStatus: function (newStatus, taskid, shipperid) {
                return task.update(
                    {'statusid': newStatus},
                    {
                        where: {
                            'taskid': taskid,
                            'shipperid': shipperid
                        }
                    })
            },

            getTaskOfShipperByOrder: function(shipperid, type, orderids) {
                if (type == "pending") {
                    return task.findAll({
                        //attributes: ['taskid'],
                        where:{
                            shipperid: shipperid,
                            statusid: 2
                        }
                    })
                } else {
                    //cancel
                    return task.findAll({
                        //attributes: ['taskid'],
                        where:{
                            shipperid: shipperid,
                            statusid: [1, 2],
                            orderid: orderids
                        }
                    })
                }
            },

            countProcessingTaskOfShipper: function (shipperid) {
                return task.count(
                    {
                        where: {
                            'statusid': 4,
                            'shipperid': shipperid
                        }
                    })
            },

            updateTaskStatusAndType: function (newTask) {//for task
                return task.update(
                    {'statusid': newTask.statusid, 'typeid': newTask.typeid },
                    {
                        where: {
                            'taskid': newTask.taskid
                        }
                    })
            },
            
            deleteTask: function (currtask) {
                return task.destroy(
                    {where: {'taskid': currtask.taskid}});
            },

            adminCountTaskOfEachShipper:function(){
                return task.findAll({
                  attributes: ['shipperid', 
                    [sequelize.fn('count', sequelize.col('taskid')),'numberTask'],
                  ], 
                  group: ['shipperid']

              })
            }
        }
    });
    return task;
};
