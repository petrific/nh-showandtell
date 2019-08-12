var employeeApp = angular.module('consumerApp', []);
employeeApp.controller('mainController', ['$scope', '$http', "$timeout", function($scope, $http, $timeout) {
    $http.get('/currentState').then(function(response) {
        $scope.data = response.data;
    });

    $http.get('/getEvents').then(function(response) {
        $scope.events = response.data;
    });

    $scope.applyEvent = function(index) {
        $http.get('/applyEvent?index=' + index)
        .then(function(response) {
            $scope.events = response.events;
        });
    };

    $timeout(function(){
        $http.get('/currentState').then(function(response) {
            $scope.data = response.data;
        });
    
        $http.get('/getEvents').then(function(response) {
            $scope.events = response.data;
        });
      },2000)
}]);