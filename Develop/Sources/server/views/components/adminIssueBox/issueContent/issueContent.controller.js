/**
 * Created by Hoang on 10/18/2015.
 */

function issueContentController($scope,$stateParams, $http, authService,config, $rootScope ,socketAdmin, $state) {
    //$rootScope.$state = $state;
    //$rootScope.$stateParams = $stateParams;

    $scope.issueid = $stateParams.issueid; //getting fooVal
    var smsData = {verticalEdge: 'right',
        horizontalEdge: 'bottom'};

    $scope.resolveTypeValue = ['continue', 'change shipper','resolve cancel','accept request cancel'];

    $scope.issue = [];

    $http.get(config.baseURI + "/api/getIssueContent?issueid=" + $scope.issueid).success(function(response){
        $scope.issue = response;
        $scope.issue.orderissues.map(function (order) {
            order.order.tasks.sort(dateSort);
            order.order.tasks.splice(1,order.order.tasks.length-1);
        });
        //var result = $.grep($scope.$parent.issueList, function(e){ return e.issueid == $scope.issueid; });
        //var index = $scope.$parent.issueList.indexOf(result[0]);
        //$scope.$parent.currentPage = Math.floor(index/$scope.$parent.pageSize);
        //$scope.$parent.$apply();
        //alert($scope.$parent.currentPage);
        //$scope.displayedOrderCollection = [].concat($scope.orderList);
    })


    $scope.updateResolve = function () {
        var promise=[];

            promise.push($http.get(config.baseURI + "/api/countProcessingTaskOfShipper?shipperid=" + $scope.issue.orderissues[0].order.tasks[0].shipperid).success(function(response){
                $scope.activeTask = response;
            }))

        //if (promise)
        Promise.all(promise).then(function () {
            //alert($scope.resolveType);
            if ($scope.activeTask>0 && $scope.resolveType == 2) {
                smsData.theme="danger";
                //data.sticky="true";
                $.notific8($("#sms-fail-assign").val(), smsData);
                //console.log(error)
                return;
            }else {

                $scope.issue.resolvetype = $scope.resolveType;

                if ($scope.issue.resolvetype == 2)//pending issue
                    resolveChangeShipperIssue();

                if ($scope.issue.resolvetype == 1) {//contiunue
                    resolveContinueIssue();
                }

                if ($scope.issue.resolvetype == 3) {//cancel issue fail good
                    resolveReturnIssue();
                }

                if ($scope.issue.resolvetype == 4) {//return issue can't find customer
                    if ($scope.issue.orderissues[0].order.statusid == 1 || $scope.issue.orderissues[0].order.statusid == 2) resolveStoreIssue();
                    else resolveReturnIssue();
                }
            }
        })
    }

    //console.log(authService.getCurrentInfoUser());
    $scope.showConfirm = function (event, resolveType){
        //alert(1);

        if ($scope.issue.isresolved) return;
        $scope.resolveType = resolveType;
        event.preventDefault();
        //$scope.getLatestLedgerOfStore(storeid);
        //console.log( $scope.selectedStore.totalcod);
        //var data=$(this).data();
        var data = new Object();
        data.effect="md-slideRight";
        $("#md-effect-block").attr('class','modal fade').addClass(data.effect).modal('show');
    };


    //resolve pending issue
    function resolveIssue(){
        return $http.put(config.baseURI + "/api/updateResolveIssue?issueid=" + $scope.issueid, $scope.issue).success(function(response){
            //$scope.issue = response;
            $scope.issue.isresolved = true;
            var result = $.grep($scope.$parent.issueList, function(e){ return e.issueid == $scope.issueid; });
            if (result.length == 1) {
                result[0].isresolved = true;
            }
            $scope.$parent.issueList.sort( $scope.$parent.sortByDate);
            smsData.theme="theme-inverse";
            $.notific8($("#sms-success").val(), smsData);

            $("#md-effect-block").attr('class','modal fade').addClass(smsData.effect).modal('hide');
            //$scope.displayedOrderCollection = [].concat($scope.orderList);
            //console.log($scope.issueList)
        },function (error) {
            smsData.theme="danger";
            //data.sticky="true";
            $.notific8($("#sms-fail").val(), smsData);
            //console.log(error)
        })
    }

    //function resolve return issue
    function resolveReturnIssue(){
        //console.log($scope.issue);
        if ($scope.issue.typeid == 4){
            $scope.issue.orderissues.map(function (issue) {
                issue.order.tasks[0].statusid = 5;//fail task
                issue.order.statusid= 8;//cancel order
                issue.order.orderstatus.statusname= 'Cancel';//cancel order
            })
            //console.log($scope.issue.orderissues);
            $http.put(config.baseURI + "/api/updateTaskStateOfIssue", $scope.issue).then(function success(response){
                resolveIssue();
            },function (error) {
                smsData.theme="danger";
                //data.sticky="true";
                $.notific8($("#sms-fail").val(), smsData);
                console.log(error)
            })
        };
        if ($scope.issue.typeid == 5 || $scope.issue.typeid == 7){
            var promise = [];
            $scope.issue.orderissues.map(function (issue) {
                issue.order.tasks[0].statusid = 2;//active task
                issue.order.tasks[0].typeid = 4;//active task
                issue.order.statusid= 6;//cancel order
                issue.order.orderstatus.statusname= 'Canceling';//cancel order
                promise.push($http.put(config.baseURI + "/api/updateTaskStateOfIssue", $scope.issue));
            });

            Promise.all(promise).then(function success(response){
                var promises = resolveIssue();
                promises.then(function () {
                    socketAdmin.issueMessage($scope.issue)
                })

            },function (error) {
                smsData.theme="danger";
                //data.sticky="true";
                $.notific8($("#sms-fail").val(), smsData);
                console.log(error)
            })
        }
    };

    //function resolve cancel store issue
    function resolveStoreIssue(){
        //console.log($scope.issue);
            $scope.issue.orderissues.map(function (issue) {
                //issue.order.tasks[0].statusid = 5;//fail task
                issue.order.statusid= 7;//cancel order
                issue.order.fee= parseInt(issue.order.fee) * 0.1;//cancel order
            })
            //console.log($scope.issue.orderissues);
            $http.put(config.baseURI + "/api/updateStateOfStoreCancelIssue", $scope.issue).then(function success(response){

                var promise = resolveIssue();
                promise.then(function () {
                    socketAdmin.issueMessage($scope.issue)
                })
            },function (error) {
                smsData.theme="danger";
                //data.sticky="true";
                $.notific8($("#sms-fail").val(), smsData);
                console.log(error)
            })

    }

    //function resolve continue issue
    function resolveContinueIssue(){
        //console.log($scope.issue);
        $scope.issue.orderissues.map(function (issue) {
            issue.order.tasks[0].statusid = 2;//fail task
            //issue.order.statusid= 2;//cancel order
            //issue.order.fee= parseInt(issue.order.fee) * 0.1;//cancel order
        })
        //console.log($scope.issue.orderissues);
        $http.put(config.baseURI + "/api/updateTaskStateOfIssue", $scope.issue).then(function success(response){
            resolveIssue();
        },function (error) {
            smsData.theme="danger";
            //data.sticky="true";
            $.notific8($("#sms-fail").val(), smsData);
            console.log(error)
        })

    }

    //function resolve continue issue
    function resolveChangeShipperIssue(){
        //console.log($scope.issue);
        $scope.issue.orderissues.map(function (issue) {
            //issue.order.tasks[0].statusid = 2;//fail task
            issue.order.ispending= false;//cancel order
            //issue.order.fee= parseInt(issue.order.fee) * 0.1;//cancel order
        })
        //console.log($scope.issue.orderissues);
        $http.put(config.baseURI + "/api/updateTaskStateOfIssue", $scope.issue).then(function success(response){
            var promise = resolveIssue();
            promise.then(function () {
                socketAdmin.issueMessage($scope.issue)
            })
        },function (error) {
            smsData.theme="danger";
            //data.sticky="true";
            $.notific8($("#sms-fail").val(), smsData);
            console.log(error)
        })

    }
    
    //function redirect to assign task page
    $scope.goToProcessing = function () {
        //alert(1);
        $("#md-effect-block").attr('class','modal fade').addClass(smsData.effect).modal('hide');

        $state.go('admin.assignTaskProcessing',{shipperid: $scope.issue.sender});
    }

    //----------------------------------
    //FUNCTION LOAD SCRIPT
    //-----------------------------------
    $scope.$watch('$viewContentLoaded', function (event) {

        caplet();

    });

    var dateSort =  function(x, y){
        if (x.taskdate > y.taskdate) {
            return -1;
        }
        if (x.taskdate < y.taskdate) {
            return 1;
        }
        return 0;
    };

}

issueContentController.$inject = ['$scope','$stateParams', '$http', 'authService','config','$rootScope', 'socketAdmin','$state'];
angular.module('app').controller('issueContentController',issueContentController);