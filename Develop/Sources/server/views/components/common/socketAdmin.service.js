/**
 * Created by hoanglvq on 10/26/15.
 */


function socketAdmin(socketService,authService,mapService, $rootScope, notificationService){

    var EPSILON = 1e-8;            

    var currentLocation = null;    
    var api = {};
    /*
        add handlers
    */
    
    socketService.on('admin:register:location', function(data) {

        mapService.setMapData(data.msg.mapData)
        .then(function() {
                //console.log('register', data);
            });

        $rootScope.onlineShipper = 0;

        data.msg.shipperList.map(function (shipper) {

            if (shipper.isConnected) $rootScope.onlineShipper++;
        });

    });

    socketService.on('admin:add:shipper', function(data) {   
       // console.log('admin:add:shipper', data);
        mapService.addShipper(data.msg.shipper);
        $rootScope.$emit("admin:dashboard:getShipperList", data.msg.shipperList);
    });

    socketService.on('admin:add:store', function(data) { 
        // console.log('admin:add:store', data);       
        mapService.addStore(data.msg.store);
    });

    socketService.on('admin:add:order', function(data) {                
        var msg = data.msg;
        mapService.addOrder(msg.orderID, msg.store, msg.shipper, msg.customer)
        .then(function() {
            console.log('admin add order', data);
        })
    });

    socketService.on('admin:update:shipper', function(data) {
        console.log('admin:update:shipper', data);
        var shipper = data.msg.shipper;
        mapService.updateShipper(shipper);

    });

    socketService.on('admin:delete:shipper', function(data) {
        console.log('admin:delete:shipper', data);
        var shipper = data.msg.shipper;
        mapService.deleteShipper(shipper.shipperID);
        $rootScope.$emit("admin:dashboard:getShipperList", data.msg.shipperList);
    });

    socketService.on('admin:update:order', function(data) {
        console.log('admin:update:order', data);
        var orders = data.msg.orders;
        orders.forEach(function(e) {
            mapService.updateOrder(e.orderID, e.orderInfo);

        });
    });

    socketService.on('admin:issue:notification', function(data) {
        console.log('admin:issue:notification', data);
        $rootScope.$emit("admin:issue:newIssue", data.msg);
        $rootScope.notify(data.msg.notification);
    });

    socketService.on('admin::issue:disconnected', function(data) {
        console.log("admin:issue:disconnected: ", data);
        $rootScope.$emit("admin:issue:newIssue", data.msg);
        $rootScope.notify(data.msg);
    });
    //admin::issue:cancelorder
    socketService.on('admin::issue:cancelorder', function(data) {
        console.log("admin::issue:cancelorder", data);
        $rootScope.$emit("admin:issue:newIssue", data.msg);
        $rootScope.notify(data.msg);
    });
    api.getCurrentUser = function() {
        var currentUser = authService.getCurrentInfoUser();        
        // TODO: Change later
        currentUser.latitude = 21.028784;
        currentUser.longitude = 105.826088;

        var dataAdmin = {
            adminID: currentUser.username,
            latitude: currentUser.latitude,
            longitude: currentUser.longitude              
        };
        return dataAdmin;
    };

    api.registerSocket = function(){
        socketService.authenSocket();
        var user = api.getCurrentUser();
        // console.log('registerSocket', user);
        socketService.sendPacket(
        {
            type: 'admin',
            clientID: user.adminID
        },
        'server',
        {
            admin: user
        },
        'client:register');
    };

    api.issueMessage = function (issue) {//send message after resolve issue
        //var shipperList = [
        var orderList = [];
        var msgToStore = {
            type: 'info',
            title: 'Info',
            //content: msg,
            url: '#/store/dashboard',
            isread: false,
            createddate: new Date()
        };

        issue.orderissues.map(function (orderissue) {
            var order = new Object();
            order['storeid'] = orderissue.order.storeid;
            order['orderid'] = orderissue.order.orderid;
            orderList.push(order);
        })
        var user = api.getCurrentUser();
        socketService.sendPacket(
            {
                type: 'admin',
                clientID: user.adminID
            },
            'server',
            {
                orderList: orderList,
                shipperid: issue.orderissues[0].order.tasks[0].shipperid,
                //categoryid: issue.issuetype.categoryid,
                typeid: issue.typeid,
                msg: msgToStore
            },
            'admin:messageIssue');
    };


    api.confirmPaymentMessage = function (storeid) {//send message after confirm payment
        //var shipperList = [
        var msgToStore = {
            type: 'info',
            title: 'Info',
            content: 'A new transaction was added successfully...',
            url: '#/store/transactionHistory',
            isread: false,
            createddate: new Date()
        };
        var user = api.getCurrentUser();
        socketService.sendPacket(
            {
                type: 'admin',
                clientID: user.adminID
            },
            'server',
            {
                storeid: storeid,
                msg: msgToStore
            },
            'admin:message:confirmPayment');
    };

    api.blockStoreMessage = function (storeid, type, reason) {//send message after confirm payment
        //var shipperList = [
        var content = "";
        if (type == 1) content = "Your store is blocked because "+ reason +"... please contact them for get more information...";
          else content = "Your store is unblocked...";
        var msgToStore = {
            type: 'info',
            title: 'Info',
            content: content,
            url: '#/store/transactionHistory',
            isread: false,
            createddate: new Date()
        };
        var user = api.getCurrentUser();
        socketService.sendPacket(
            {
                type: 'admin',
                clientID: user.adminID
            },
            'server',
            {
                storeid: storeid,
                msg: msgToStore
            },
            'admin:notification:blockStore');
    };

    return api;
}


socketAdmin.$inject = ['socketService','authService','mapService', '$rootScope','notificationService'];

angular.module('app').factory('socketAdmin', socketAdmin);