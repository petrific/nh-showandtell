var employeeApp = angular.module('consumerApp', []);
employeeApp.controller('mainController', ['$scope', '$http', "$interval", function($scope, $http, $interval) {
    $scope.props = [];
    $http.get('/currentState').then(function(response) {        
        $scope.data = response.data;
        Object.keys(response.data).forEach(function(key) {
            $scope.props.push(key);
        });
    });

    $http.get('/getEvents').then(function(response) {
        $scope.events = response.data;
    });

    $scope.applyEvent = function(index) {
        $http.get('/applyEvent?index=' + index)
        .then(function(response) {
            $scope.events = response.data.events;
            $scope.data = response.data.data;
        });
    };

    $interval(function(){
        $http.get('/currentState').then(function(response) {
            $scope.data = response.data;
        });
    
        $http.get('/getEvents').then(function(response) {
            $scope.events = response.data;
        });
      },2000);
}]);