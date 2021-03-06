/**
 * Created by Hoang on 10/18/2015.
 */

function adminAddStoreController($scope,$state, $http, $filter, config, dataService) {
    var smsData = {verticalEdge: 'right',
        horizontalEdge: 'bottom'};
    getDataFromServer();

    function getDataFromServer(){

        $scope.newStoreOwner = new Object();
        $scope.newStoreOwner.account = new Object();
        $scope.newStoreOwner.profile = new Object();
        $scope.newStoreOwner.profile.avatar = "assets/avatar/store_ower/Default.png";
        $scope.newStore = new Object();
        $scope.newStore.avatar = "assets/avatar/store/Default.jpg";
        //$scope.newStoreOwner.profile.dob = null;

        dataService.getDataServer(config.baseURI + "/api/store/getNewStoreOwnerID").then(function(rs){
            $scope.newStoreOwner.account.username = rs.data;
            $scope.newStoreOwner.profile.username = rs.data;
            //console.log(response);
        });

        dataService.getDataServer(config.baseURI + "/api/store/getNewStoreID").then(function(rs){
            $scope.newStore.storeid = rs.data;
            //console.log(response);
        });

        dataService.getDataServer(config.baseURI + "/api/profile/getAllProfileToCheck")
            .then(function(rs){
                $scope.profileCheckList = rs.data;
                //console.log(response);
            });

        dataService.getDataServer(config.baseURI + "/api/store/getAllStoreToCheck")
            .then(function(rs){
                $scope.storeCheckList = rs.data;
                //console.log(response);
            });
    }

    function checkProfileInfo(profile){
        var result = $.grep($scope.profileCheckList,
            function(e){ return e.email == profile.email});
        if (result.length > 0) return 1;
        result = $.grep($scope.profileCheckList,
            function(e){ return e.phonenumber == profile.phonenumber});
        if (result.length > 0) return 2;
        result = $.grep($scope.profileCheckList,
            function(e){ return e.identitycard == profile.identitycard});
        if (result.length > 0) return 3;
        return 0;
    }

    function checkStoreInfo(store){
        var result = $.grep($scope.profileCheckList,
            function(e){ return e.email == store.email});
        if (result.length > 0) return 1;
        result = $.grep($scope.profileCheckList,
            function(e){ return e.phonenumber == store.phonenumber});
        if (result.length > 0) return 2;

        return 0;
    }

    $scope.createStore = function () {
       var valid = $('#formStore').parsley( 'validate' );
        if (!valid) return;

        $scope.checkStore = checkStoreInfo($scope.newStore);
        //console.log($scope.checkProfile);
        if ($scope.checkStore != 0){
            smsData.theme="danger";
            //data.sticky="true";
            if ($scope.checkStore == 1) $.notific8($("#sms-fail-email").val(), smsData);
            else $.notific8($("#sms-fail-phone").val(), smsData)
            //console.log(error)
            return;
        }

        $scope.newStoreOwner.account.userrole = 2;
        $scope.newStoreOwner.account.userstatus = 2;
        $scope.newStoreOwner.profile.dob = new Date($scope.newStoreOwner.profile.dob);
        $scope.newStore.registereddate = new Date();
        var promises= [];
        var managestore = new Object();
        managestore['storeid'] = $scope.newStore.storeid;
        managestore['managerid'] = $scope.newStoreOwner.account.username;
        promises.push( dataService.postDataServer(config.baseURI + "/api/user/addNewUser", $scope.newStoreOwner));
        promises.push( dataService.postDataServer(config.baseURI + "/api/store", $scope.newStore));
        Promise.all(promises).then(function () {
            promises.push( dataService.postDataServer(config.baseURI + "/api/store/addManageStore", managestore));
        })
       //console.log(valid);
        Promise.all(promises).then(function () {
            smsData.theme="theme-inverse";
            $.notific8($("#sms-success").val(), smsData);
            $state.go('admin.storeList');
        }) .catch(function (error) {
            smsData.theme="danger";
            //data.sticky="true";
            $.notific8($("#sms-fail").val(), smsData);
            console.log(error)
        })
    }
    //----------------------------------
    //FUNCTION LOAD SCRIPT
    //-----------------------------------
    $scope.$watch('$viewContentLoaded', function (event) {

        caplet();

    });

    $(document).ready(function() {
        $('#rootwizard').bootstrapWizard({
            tabClass:"nav-wizard",
            onTabShow: function(tab, navigation, index) {
                tab.prevAll().addClass('completed');
                tab.nextAll().removeClass('completed');
                if(tab.hasClass("active")){
                    tab.removeClass('completed');
                }
                var $total = navigation.find('li').length;
                var $current = index+1;
                var $percent = ($current/$total) * 100;
                $('#rootwizard').find('.progress-bar').css({width:$percent+'%'});
                $('#rootwizard').find('.wizard-status span').html($current+" / "+$total);
            }
        });

        $('#validate-wizard').bootstrapWizard({
            tabClass:"nav-wizard",
            onNext: function(tab, navigation, index) {
                var content=$('#step'+index);
                if(typeof  content.attr("parsley-validate") != 'undefined'){
                    var $valid = content.parsley( 'validate' );
                    if(!$valid){
                        return false;
                    };
                    var dob = new Date($scope.newStoreOwner.profile.dob);
                    if (dob.getFullYear()>2014)
                    {
                        smsData.theme="danger";
                        //data.sticky="true";
                        $.notific8($("#sms-fail-date").val(), smsData);
                        //console.log(error)
                        return false;
                    };

                    $scope.checkProfile = checkProfileInfo($scope.newStoreOwner.profile);
                    //console.log($scope.checkProfile);
                    if ($scope.checkProfile != 0){
                        smsData.theme="danger";
                        //data.sticky="true";

                        if ($scope.checkProfile == 3) $.notific8($("#sms-fail-identity").val(), smsData);
                        else if ($scope.checkProfile == 1) $.notific8($("#sms-fail-email").val(), smsData);
                        else $.notific8($("#sms-fail-phone").val(), smsData)
                        //console.log(error)
                        return false;
                    }
                };
                // Set the name for the next tab
                $('#step4 h3').find("span").html($('#fullname').val());
            },
            onTabClick: function(tab, navigation, index) {
                $.notific8('Please click <strong>next button</strong> to go to next step!! ',{ life:5000, theme:"danger" ,heading:" Error :); "});
                return false;
            },
            onTabShow: function(tab, navigation, index) {
                tab.prevAll().addClass('completed');
                tab.nextAll().removeClass('completed');
                if(tab.hasClass("active")){
                    tab.removeClass('completed');
                }
                var $total = navigation.find('li').length;
                var $current = index+1;
                var $percent = ($current/$total) * 100;
                $('#validate-wizard').find('.progress-bar').css({width:$percent+'%'});
                $('#validate-wizard').find('.wizard-status span').html($current+" / "+$total);
            }
        });

    });


}

adminAddStoreController.$inject = ['$scope','$state', '$http', '$filter', 'config', 'dataService'];
angular.module('app').controller('adminAddStoreController',adminAddStoreController);