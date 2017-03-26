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

	projectFactory.checkout = function(payload){
		return $http.post('/api/checkout', payload);
	}

	projectFactory.getClientToken = function(){
		return $http.get('/api/client_token');	
	}

	projectFactory.pay = function(payload){
		return $http.post('/api/pay', payload);
	}	

	projectFactory.getAllFunded = function(){
		return $http.get('/api/getAllFunded');
	}

	projectFactory.getTopProjects = function(){
		console.log('getTopProjects service');
		return $http.get('/api/getTopProjects');	
	}


	var data = [];
	projectFactory.addData = function(obj){
		data.push(obj);
	}

	projectFactory.getData = function(){
		return data;
	}

	return projectFactory;
});