

var employeeApp = angular.module('employeeApp', []);
employeeApp.controller('mainController', ['$scope', '$http', function($scope, $http) {
    $http.get('/literallyOnlyEmployee').then(function(response) {
        $scope.data = response.data;
    });

    $scope.submitForm = function() {
        $http({ method: 'PUT', 
                url: '/updateEmployee',
                headers: {'Content-Type': 'application/json;charset=UTF-8'},
                data: $scope.data })
        .then(function(response) {
            $scope.data = response.data;
        });
    };
}]);