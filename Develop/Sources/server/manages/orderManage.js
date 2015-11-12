/**
 * Created by Cao Khanh on 21/10/2015.
 */
var _ = require('lodash');

module.exports = function (app) {
    var db = app.get('models');

    var params = function (req, res, next, order_id) {
        var OrderStatus = db.orderstatus;
        var goods = db.goods;
        var confirmCode = db.confirmationcode;
        return db.order.storeGetOneOrder(OrderStatus,goods,confirmCode,order_id)
            .then(function (order) {
                if (order) {
                    req.orderRs = order;
                    next();
                } else {
                    next(new Error('No order with id'));
                }

            }, function (err) {
                next(err);
            });

    };

    var getAllOrder = function (req, res, next) {

        var storeId = req.user.stores[0];
        var orderStatus = db.orderstatus;
        var order = db.order;
        var ordertype = db.ordertype;
        return order.storeGetAllOrders(orderStatus,ordertype, storeId)
            .then(function (orders) {
                var listOrders = [];
                var statusname = '';
                var createDate = '';
                var doneDate ='';
                var ledgerid ='';
                _.each(orders, function(order){
                    if(order['orderstatus'] == null){
                        statusname = '';
                    } else {
                        statusname = order['orderstatus'].dataValues.statusname;
                    }
                    if(order.dataValues.createdate == null){
                        createDate = '';
                    }else {
                        createDate = order.dataValues.createdate;
                    }
                    if(order.dataValues.donedate == null){
                        doneDate = '';
                    }else {
                        doneDate = order.dataValues.donedate;
                    }
                    if(order.dataValues.ledgerid == null){
                        ledgerid = '';
                    }else {
                        ledgerid = order.dataValues.ledgerid;
                    }
                    listOrders.push({
                        'orderid': order.dataValues.orderid,
                        'statusname': statusname,
                        'deliveryaddress': order.dataValues.deliveryaddress,
                        'recipientname' : order.dataValues.recipientname,
                        'recipientphone' : order.dataValues.recipientphone,
                        'isdraff': order.dataValues.isdraff,
                        'iscancel':order.dataValues.iscancel,
                        'ispending': order.dataValues.ispending,
                        'cod': order.dataValues.cod,
                        'fee' : order.dataValues.fee,
                        'createdate' : createDate,
                        'donedate' : doneDate,
                        'ordertype': order['ordertype'].dataValues.typename,
                        'ledgerid': ledgerid

                    })
                });
                var totalNewOrder = 0;
                var totalNewCod =0;
                var totalNewFee = 0;
                var todayOrder =0;
                var todayCod = 0;
                var todayFee = 0;
                var group = {};
                group['Total'] = group['Total'] || [];
                group['Draff'] = group['Draff'] || [];
                group['Done'] = group['Done'] || [];
                group['Inprocess'] = group['Inprocess'] || [];
                _.each(listOrders, function(item) {
                    if(item['isdraff']) {
                        group['Draff'].push(item);
                    }else if(_.isEqual(item['statusname'],'Done')){
                        group['Done'].push(item);
                    }else {
                        group['Inprocess'].push(item);
                    }
                    
                    
                    if(item.ledgerid == '' && !item['isdraff']){
                        totalNewCod = totalNewCod + parseInt(item.cod);
                        totalNewFee = totalNewFee + parseInt(item.fee);
                        totalNewOrder++;

                        if(!_.isEqual(item['createdate'],'')){
                        var date = new Date(item['createdate']);
                        date.setHours(0,0,0,0);
                        var today = new Date();
                        today.setHours(0,0,0,0);
                        if(date.valueOf() === today.valueOf())
                            todayOrder ++;
                    }

                    if(!_.isEqual(item['donedate'],'')){
                        var date = new Date(item['donedate']);
                        date.setHours(0,0,0,0);
                        var today = new Date();
                        today.setHours(0,0,0,0);
                        if(date.valueOf() === today.valueOf()){
                            todayCod = todayCod + parseInt(item.cod);
                            todayFee = todayFee + parseInt(item.fee);
                        }

                    }
                    }

                });

                group['Total'].push(totalNewCod);
                group['Total'].push(totalNewFee);
                group['Total'].push(todayOrder);
                group['Total'].push(todayCod);
                group['Total'].push(todayFee);
                group['Total'].push(totalNewOrder);

                res.status(200).json(group);
            }, function (err) {
                next(err);
            })
    };


    var getOne = function (req, res, next) {
        //var listOrders = [];
        //var statusname = '';
        //var deliveryaddress = '';
        //var recipientname = '';
        //var recipientphone = '';
        //var donedate = '';
        //var createdate = '';
        //var cod = 0;
        //var fee = 0;
        //console.log(req.orderRs['orderid']);
        //var order = {
        //    orderid : req.orderRs['orderid'],
        //    deliveryaddress : req.orderRs['deliveryaddress'],
        //    recipientname : req.orderRs['recipientname'],
        //    recipientphone : req.orderRs['recipientphone'],
        //    statusid : req.orderRs['statusid'],
        //    isdraff : req.orderRs['isdraff'],
        //    iscancel : req.orderRs['iscancel'],
        //    ispending : req.orderRs['ispending'],
        //    cod : req.orderRs['cod'],
        //    fee : req.orderRs['fee'],
        //    donedate : req.orderRs['donedate'],
        //    createdate : req.orderRs['createdate'],
        //    statusname : req.orderRs['orderstatus'].statusname
        //};
        //
        //var rs =  req.orderRs['goods'];
        //_.each(rs, function(item) {
        //    console.log(item.dataValues.goodsid);
        //});
        res.status(200).json(req.orderRs);
    };

    var post = function (req, res, next) {
        var newOrder = {};

        var str = "000000" + parseInt(Math.random()*1000000);
        var formatStr = str.substr(str.length - 6);
        var newOrderID = "OD" + formatStr;        
        newOrder.orderid = newOrderID;
       // console.log("ORRDDDDDDDD=========",newOrderID);

        console.log("=============req.body===============",req.body);
        newOrder.storeid = req.body.order.storeid;
        newOrder.ordertypeid = req.body.order.ordertypeid;
        newOrder.pickupaddress = req.body.order.pickupaddress;
        newOrder.deliveryaddress = req.body.order.deliveryaddress;
        //newOrder.pickupaddress = null;
        //newOrder.deliverydate = null;
        //newOrder.donedate = null;
        newOrder.recipientphone = req.body.order.recipientphone;
        newOrder.recipientname = req.body.order.recipientname;
        //newOrder.ledgerid = null;
        newOrder.statusid = req.body.order.statusid;
        newOrder.ispending = 'false';
        newOrder.isdraff = req.body.order.isdraff;
        newOrder.iscancel = 'false';
        newOrder.createdate = new Date();        
        if(!_.isNumber(req.body.order.cod)){
            newOrder.cod = 0;
        }else {
            newOrder.cod = req.body.order.cod;
        }

        if(!_.isNumber(req.body.order.fee)){
            newOrder.fee = 0;
        }else {
            newOrder.fee = req.body.order.fee;
        } 
       
       console.log("==============11===============");
       ////////////
        var str = "000000" + parseInt(Math.random()*1000000);
        var formatStr = str.substr(str.length - 6);                    
        var newCodeID = formatStr;
        /////////////
        
        var code1 = {
        'codecontent' : req.body.order.gatheringCode,
        'typeid' : 2,
        'orderid' : newOrder.orderid,
        'codeid' : newCodeID++
       };
       var code2 = {
        'codecontent' : req.body.order.deliverCode,
        'typeid' : 6,
        'orderid' : newOrder.orderid,
        'codeid' : newCodeID++
       };       
       
       var code3 = {
        'codecontent' : req.body.order.inStockCode,
        'typeid' : 3,
        'orderid' : newOrder.orderid,
        'codeid' : newCodeID++
       };
       var code4 = {
        'codecontent' : req.body.order.returnStoreCode,
        'typeid' : 5,
        'orderid' : newOrder.orderid,
        'codeid' : newCodeID++
       };
       console.log("==============22==============");
       
        return db.order.postOneOrder(newOrder)
            .then(function () {
                console.log("==============33==============");
                db.confirmationcode.postOneCode(code1);
                db.confirmationcode.postOneCode(code2);
                db.confirmationcode.postOneCode(code3);
                db.confirmationcode.postOneCode(code4);
                console.log("==============44==============");
                for(var i = 0; i < req.body.goods.length; i++){
                    var good = {};
                    var str = "000000" + parseInt(Math.random()*1000000);
                    var formatStr = str.substr(str.length - 6);                    
                    var newGoodID =  formatStr;
                    good.goodsid = newGoodID;
                    good.orderid = newOrderID;
                    good.stockid = null;
                    if(!_.isNumber(req.body.goods[i].weight)){
                        good.weight = 0;
                    } else {
                        good.weight = req.body.goods[i].weight;
                    }

                    if(!_.isNumber(req.body.goods[i].lengthsize)){
                        good.lengthsize = 0;
                    } else {
                        good.lengthsize = req.body.goods[i].lengthsize;
                    }

                    if(!_.isNumber(req.body.goods[i].widthsize)){
                        good.widthsize = 0;
                    } else {
                        good.widthsize = req.body.goods[i].widthsize;
                    }

                    if(!_.isNumber(req.body.goods[i].heightsize)){
                        good.heightsize = 0;
                    } else {
                        good.heightsize = req.body.goods[i].heightsize;
                    }

                    if(!_.isNumber(req.body.goods[i].amount)){
                        good.amount = 0;
                    } else {
                        good.amount = req.body.goods[i].amount;
                    }
                    good.description = req.body.goods[i].description;

                    db.goods.postOneGood(good);
                    console.log("==============55==============");
                }

            })
            
             .then(function () {
                res.status(201).json("Saved");
            }, function(err){
                next(err);
            })
        };
           
    

    var put = function (req, res, next) {
        var order = {};
        var update = req.body;

        order.orderid = update.orderid;
        order.storeid = update.storeid;
        order.ordertypeid = update.ordertypeid;
        order.pickupaddress = update.pickupaddress;
        order.deliveryaddress = update.deliveryaddress;
        order.pickupdate = update.pickupdate;
        order.deliverydate = update.deliverydate;
        order.recipientphone = update.recipientphone;
        order.recipientname = update.recipientname;

        return db.order.putOrder(order)
            .then(function(save){
                if(save){
                    res.status(201).json(order);
                }else {
                    next( new Error('Cannot save user'));
                }
            })
    };

    var deleteOrder = function (req, res, next) {
        req.orderRs = req.orderRs.toJSON();
        var deleteGoods = db.goods.deleteGood(req.orderRs.orderid);
        var deleteCode = db.confirmationcode.deleteConfirmCode(req.orderRs.orderid);
        Promise.all([deleteCode,deleteGoods]).then(function(){
            db.order.deleteDraffOrder(req.orderRs.orderid)
                .then(function() {
                    res.status(200).json("DELETED!");
                }, function(err) {
                    next(new Error("Delete draft fail!"));
                });
        },function(){
            next(new Error("Delete draft fail!"));
        });
    };

    var putDraff = function(req, res, next){
        db.order.submitDraffOrder(req.body.orderid)
        .then(function(){
            res.sendStatus(200);
        }, function(err) {
            next(err);
        });
    };

    var cancelOrder = function (req, res, next) {
        db.order.cancelOrder( req.orderRs.orderid);
            //.then(function(){
            //    res.sendStatus(200).json();
            //}, function(err) {
            //    next(err);
            //});
    };

    var getOrderList = function (req, res, next) {
        db.order.getAllOrder(db.orderstatus, db.ordertype, db.store)
        .then(function(list){
            res.status(200).json(list);
        }, function(err) {
            next(err);
        });
    };


    return {
        getAllOrder: getAllOrder,
        getOne: getOne,
        postOne: post,
        params: params,
        put : put,
        deleteOrder : deleteOrder,
        putDraff : putDraff,
        cancelOrder: cancelOrder,
        getOrderList: getOrderList
    }
}