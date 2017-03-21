var app = angular.module('kickstarter',['appRoutes', 'userControllers', 'userServices', 'ngAnimate', 'mainController', 'authServices', 'managementController', 'projectController']);

app.config(function($httpProvider){
	$httpProvider.interceptors.push('AuthInterceptors');
});