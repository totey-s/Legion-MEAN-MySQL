var app = angular.module('projectServices',[]);

app.factory('Project', function($http){
	var projectFactory = {};

	//	Project.add(projectData);
	projectFactory.add = function(projectData){
		return $http.post('/api/addProject', projectData);
	};

	projectFactory.getAllApprovedProjects = function(){
		return $http.get('/api/getAllApprovedProjects');	
	};	

	projectFactory.getAllUserProjects = function(){
		return $http.get('/api/getAllUserProjects');	
	};

	projectFactory.getAllUnapproved = function(){
		return $http.get('/api/getAllUnapproved');
	};

	//Project.approve(id);
	projectFactory.approveProject = function(projectData){
		return $http.post('/api/approveProject', projectData);	
	}

	projectFactory.escalate = function(projectData){
		return $http.post('/api/escalate', projectData);		
	}

	projectFactory.declineProject = function(projectData){
		return $http.post('/api/decline', projectData);	
	}

	return projectFactory;
});