/**
 * Created by hoanglvq on 9/22/15.
 */

/* Script */
angular.module('app', [
    'ui.router',
    'angular-jwt',
    'nemLogging',
    'uiGmapgoogle-maps',
	'smart-table'
]).constant("config",{		

    role: {
        shipper: 1,
        store: 2,
        admin: 3
    }

}).config(function($stateProvider,$urlRouterProvider,$httpProvider,jwtInterceptorProvider,uiGmapGoogleMapApiProvider,config){

     //Set up Routes

    $urlRouterProvider.otherwise('/auth/login');

    $stateProvider
        .state('login',{
            url: '/auth/login',
            template: '<login></login>'
        })

        .state('error',{
            url: '/error',
            template: '<error-page></error-page>'
        })

        .state('admin',{
            //abstract: true,
            url: '/admin',
            template: '<admin></admin>',
            access: config.role.admin
        })
        .state('admin.storeList',{
            url: '/storeList',
            template: '<admin-store-list></admin-store-list>',
            access: config.role.admin
        })
        .state('admin.assignTask',{
            url: '/assignTask',
            template: '<admin-assign-task></admin-assign-task>',
            access: config.role.admin
        }).state('admin.transactionHistory',{
            url: '/transactionHistory',
            template: '<admin-transaction-history></admin-transaction-history>',
            access: config.role.admin
        }).state('admin.taskList',{
            url: '/taskList',
            template: '<admin-task-list></admin-task-list>',
            access: config.role.admin
        })
        .state('store',{
            //abstract: true,
            url: '/store',
            template: '<store></store>',
            access: config.role.store
        })
        //.state('store.map',{
        //    url: '/map',
        //    template: '<map></map>'
        //})
        .state('store.dashboard',{
            url: '/dashboard',
            templateUrl: '/components/storeDashboard/layout.html',
            controller: function($scope, $rootScope, mapService){
                var mode = "all";
                $scope.shippers = mapService.getShipperMarkers(mode);
                $scope.stores = mapService.getStoreMarkers(mode);
                $scope.customers = mapService.getCustomerMarkers(mode);
                $scope.orders = mapService.getOrders(mode);
            },
            access: config.role.store
        })
        .state('store.order',{
            url: '/order',
            template: '<store-order></store-order>',
            access: config.role.store
        })

    jwtInterceptorProvider.tokenGetter = function(){
        return localStorage.getItem('EHID');
    };

    $httpProvider.interceptors.push('jwtInterceptor');

    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyAFwZM1zlceJr8rMvXxHwS06S3ljhXnlDI',
        v  : '3.20',
        libraries: 'geometry,visualization,drawing,places'
    })

}).run(function($rootScope,$state,authService,config,socketStore,socketAdmin,socketShipper){

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

        if(toState.access){

            if(!authService.isLogged()){
                $state.go("login");
                event.preventDefault();
                return;
            }

            if(!authService.isRightRole(toState.access)){
                $state.go("error");
                event.preventDefault();
                return;
            }
        }

        if(toState.name == 'login'){
            if(authService.isLogged()){
                if(authService.isRightRole(config.role.admin)){
                    event.preventDefault();
                }
                if(authService.isRightRole(config.role.store)){
                    event.preventDefault();
                }
            }
        }

    });

    $rootScope.$on('$stateChangeSuccess', function(e, toState){

        if (toState.name == "login"){
            $rootScope.styleBody = "full-lg";
        }
        else{
            $rootScope.styleBody = "leftMenu nav-collapse";
        }

    })

    if(authService.isLogged()){
        if(authService.isRightRole(config.role.admin)){
            socketAdmin.registerSocket();            
        }

        if(authService.isRightRole(config.role.store)){
            socketStore.registerSocket();
        }

        if(authService.isRightRole(config.role.shipper)){
            socketShipper.registerSocket();
        }
    }

})







