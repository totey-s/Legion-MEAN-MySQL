var app = angular.module('projectServices',[]);

app.factory('Project', function($http){
	var projectFactory = {};

	//	Project.add(projectData);
	projectFactory.add = function(projectData){
		return $http.post('/api/addProject', projectData);
	};

	projectFactory.getAll = function(){
		return $http.get('/api/getAllProjects');	
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