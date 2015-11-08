/**
 * Created by Kaka Hoang Huy on 11/08/15.
 */


function socketShipper($rootScope, $q,socketService,authService,mapService, $ionicLoading, $timeout) {


  var EPSILON = 1e-8;

  var currentLocation = null;
  var api = {};

  /*
   add handlers
   */

  socketService.on('shipper:register:location', function(data) {
    mapService.setMapData(data.msg.mapData)
      .then(function() {
        console.log('register', data);
      });
  });

  socketService.on('shipper:choose:express', function(data) {
    //Grab Express Order
    $rootScope.counter = 20; /*20s*/
    $rootScope.onTimeout = function(){
      $rootScope.counter--;
      mytimeout = $timeout($rootScope.onTimeout,1000);
      if ($rootScope.counter == 0) {
        $rootScope.stop();
      }
    };
    var mytimeout = $timeout($rootScope.onTimeout,1000);

    $rootScope.stop = function(){
      $timeout.cancel(mytimeout);
    };
    //Ionic Loading
    $rootScope.show = function() {
      $ionicLoading.show({
        template: '<div class="popup">' +
        '<div class="popup-head" style="background-color: rgb(239, 71, 58);'  +
        'border-radius: 5px;border-bottom: 1px solid rgb(239, 71, 58);padding: 12px 10px">' +
        '<h3 class="popup-title" style="font-size: 1.2em; font-weight: bold;">Grab</h3>' +
        '</div>' +
        '<div class="popup-body">' +
        '<span style="font-size: 2.5em; display: block; margin: 7px 0">{{counter}}</span>' +
        '<div id="graborder">' +
        '<p>Order: Order 1</p>' +
        '<p>Địa chỉ: Bắc Giang - Hà Nội - Địa chỉ: Bắc Giang - Hà Nội</p>' +
        '<p>Số điện thoại: 01679212683</p>' +
        '</div>' +
        '</div>' +
        '<div class="popup-buttons">' +
        '<a href="#" ng-click="hide()" class="button btn-default-cus" >Cancel</a>' +
        '<a ng-click="grabExpressOrder()" class="button btn-success-cus btn-default-cus">Grab</a>' +
        '</div>' +
        '</div>',
        scope: $rootScope,
        duration: 20000
      });
    };
    $rootScope.show();
    $rootScope.hide = function(){
      $ionicLoading.hide();
    };
    //var answer = confirm('Do you want to accept order from store of ' + data.msg.distanceText + ' away?');
    var answer = false;
    $rootScope.grabExpressOrder = function() {
      answer = true;
    };
    if (answer) {
      api.getCurrentUser()
        .then(function(user) {
          socketService.sendPacket(
            {
              type: 'shipper',
              clientID: user.shipperID
            },
            data.sender,
            {
              shipper: user
            },
            'shipper:choose:express');
        })
        .catch(function(err) {
          alert(err);
        });
    }
  });

  socketService.on('shipper:add:order', function(data) {
    var msg = data.msg;
    mapService.addOrder(msg.orderID, msg.store, msg.shipper, msg.customer)
      .then(function() {
        console.log('shipper add order', data);
        // console.log('after add order', mapService.getStoreMarkers(), mapService.getCustomerMarkers(), mapService.getOrders());
      });
  });

  api.getCurrentUser = function() {
    var currentUser = authService.getCurrentInfoUser();

    d = $q.defer();
    navigator.geolocation.getCurrentPosition(function(position){
      var dataShipper = {
        shipperID: currentUser.username,
        status: currentUser.workingstatusid
      };
      currentLocation = position.coords;
      dataShipper.latitude = position.coords.latitude;
      dataShipper.longitude = position.coords.longitude;

      d.resolve(dataShipper);
    },function(){
      d.reject("Can't get your current location! Please check your connection");
    });

    return d.promise;
  };

  api.watchCurrentPosition = function() {
    var geo_success = function(position) {
      // if (currentLocation
      //     && Math.abs(currentLocation.latitude - position.coords.latitude) <= EPSILON
      //     && Math.abs(currentLocation.longitude - position.coords.longitude) <= EPSILON) {
      //     console.log('the same location');
      //     return;
      // }
      console.log('different location');
      currentLocation = position.coords;
      var currentUser = authService.getCurrentInfoUser();
      socketService.sendPacket(
        {
          type: 'shipper',
          clientID: currentUser.username
        },
        ['admin', { room: currentUser.username }],
        {
          shipper: {
            shipperID: currentUser.username,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }
        },
        'shipper:update:location');
    };

    var geo_failure = function(err) {
      console.log('geo_failure', err);
    };

    var geo_options = {
      enableHighAccuracy: true,
      maximumAge        : Infinity,
      timeout           : Infinity
    };

    if (navigator.geolocation) {
      return navigator.geolocation.watchPosition(geo_success, geo_failure, geo_options);
    }
  };

  api.stopWatchCurrentPosition = function(watchID) {
    navigator.geolocation.clearWatch(watchID);
  };

  api.registerSocket = function(){
    api.getCurrentUser()
      .then(function(user) {
        mapService.addShipper(user)
          .then(function() {
            socketService.sendPacket(
              {
                type: 'shipper',
                clientID: user.shipperID
              },
              'server',
              {
                shipper: user
              },
              'client:register');

            // Test watch position
            // var watchID = api.watchCurrentPosition();
            // setTimeout(function() {
            //     console.log('stop watch');
            //     api.stopWatchCurrentPosition(watchID);
            // }, 10000);
          });
      })
      .catch(function(err){
        alert(err);
      });
  };

  return api;
}

socketShipper.$inject = ['$rootScope', '$q','socketService','authService','mapService', '$ionicLoading', '$timeout'];
app.factory('socketShipper', socketShipper);