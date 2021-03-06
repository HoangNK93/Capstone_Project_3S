/**
 * Created by Nguyen Van Quyen on 10/27/2015.
 */

app.controller('BestWayCtrl', ['$scope','$stateParams','mapService', function($scope, $stateParams, mapService) {

  //set Option Selected
  $scope.selectOpt = $stateParams.tabParam;
  if ($scope.selectOpt === "pickup") {
    $scope.selectPickupOpt = true;
  } else if ($scope.selectOpt === "ship")  {
    $scope.selectShipOpt = true;
  } else if ($scope.selectOpt === "express") {
    $scope.selectExpressOpt = true;
  } else {
    $scope.selectAllOpt = true;
  }

  $scope.refresh = function() {
    console.log('refresh', $scope.selectOpt);
  };

}])
