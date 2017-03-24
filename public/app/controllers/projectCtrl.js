var app = angular.module('projectController',['projectServices']);

app.controller('exploreProjectCtrl', function($scope, Project){
	var appData = this;

	$scope.currentPage = 1;
	
	appData.limit = 5;
	appData.loading = true;
	//console.log("In Project Explore");

	var showApprovedProjects = function(){		
		//console.log("In showApprovedProjects");
		Project.getAllApprovedProjects().then(function(data){	
			appData.loading = false;		
			//console.log(data.data.projects);			
			if(data.data.projects.length !== 0){
				appData.projects = data.data.projects;
				$scope.projects = appData.projects;
				$scope.curUser = data.data.curUser;
				appData.noProjects = false;
			}else{
				appData.noProjects = true;
			}
			
		});
	};
	
	showApprovedProjects();

	appData.fund = function(projectId){
		console.log(projectId);
		Project.fund(projectId).then(function(data){

		});
	};

	appData.showMore = function(number){
		appData.showMoreError = false;
		if(number>0){
			appData.limit = number;
		}else{
			appData.showMoreError = 'Please enter a valid number';
		}
	};

	appData.showAll = function(){
		appData.limit = undefined;
		appData.showMoreError = false;
	};

	appData.search = function(searchKeyword, number){
    	if(searchKeyword){
    		if(searchKeyword.length>0){
    			appData.limit = 0;
    			$scope.searchFilter = searchKeyword;
    			appData.limit = number;
    		}else{
    			$scope.searchFilter = undefined;
    			appData.limit = 0;	
    		}
    	}else{
    		$scope.searchFilter = undefined;
    		appData.limit = 0;
    	}
    };

	appData.clear = function(){
    	$scope.number = 'Clear';
    	appData.limit = 0;
    	$scope.searchKeyword = undefined;
    	$scope.searchFilter = undefined;
    	appData.showMoreError = false;
    };

    //---------------------PayPal------------------------------------------------------------------
});

app.filter('pagination', function(){	
	return function(data, start){	
	if(data !== undefined){
		return data.slice(start);
	}			
	};
});

app.controller('fundProjectCtrl', function($scope, $routeParams){
	var app = this;
	console.log($routeParams.id);
});

app.controller('projectCtrl',['$scope', 'Project', function($scope, Project){
	console.log("Project Controller");	
	var appData = this;

	appData.noProjects = true;
	appData.load = false;

	appData.showModal = function(){
		$scope.categories = [{name:'Art'}, {name:'Craft'}, {name:'Comics'}, {name:'Fashion'}, {name:'Film'}, {name:'Technology'}];		
		$scope.category = $scope.categories[1];
		$('#addProjectModal').modal({backdrop: 'static'});		
	}

	appData.addProject = function(projectData){
		appData.load = true;
		console.log(appData.projectData);
		Project.add(appData.projectData).then(function(data){
			appData.load = false;
			if(data.data.success){
				appData.successMsg = data.data.message;
				$('#addProjectModal').modal("hide");
				showProjectsOfCurrentUser();
			}else{
				appData.errorMsg = data.data.message;
			}
		});
		showProjectsOfCurrentUser();
	}

	var showProjectsOfCurrentUser = function(){		
		Project.getAllUserProjects().then(function(data){			
			console.log(data.data.projects);
			if(data.data.projects.length !== 0){
				appData.projects = data.data.projects;	
				appData.noProjects = false;
			}else{
				appData.noProjects = true;
			}
			
		});
	};

	showProjectsOfCurrentUser();
}]);

app.controller('projectManagementCtrl', function($scope, Project, $timeout){
	console.log("Project Management Controller");	
	var appData = this;

	appData.noProjects = true;
	appData.load = false;


	appData.approve = function(projectId){
		appData.load = true;
		var projectObject = {};
		projectObject.id = projectId;
		Project.approveProject(projectObject).then(function(data){
			appData.load = false;
			if(data.data.success){
				appData.successMsg = data.data.message;
				showAllUnapprovedProjects();
				$timeout(function() {                    
                    appData.successMsg = false; // Clear success message                    
                }, 5000);
			}else{
				appData.errorMsg = data.data.message;
			}
		});	
	}

	appData.decline = function(projectId){
		appData.load = true;
		var projectObject = {};
		projectObject.id = projectId;
		Project.declineProject(projectObject).then(function(data){
			appData.load = false;
			if(data.data.success){
				appData.successMsg = data.data.message;
				showAllUnapprovedProjects();
				$timeout(function() {                    
                    appData.successMsg = false; // Clear success message                    
                }, 5000);
			}else{
				appData.errorMsg = data.data.message;
			}
		});	
	}

	var showAllUnapprovedProjects = function(){
		appData.load = true;		
		appData.isAdmin = false;
		appData.isModerator = false;
		Project.getAllUnapproved().then(function(data){	
		appData.load = false;					
			if(data.data.projects.length !== 0){
				appData.projects = data.data.projects;	
				if(data.data.permission === 'admin'){
					appData.isAdmin = true;
					appData.isModerator = false;
				}else if(data.data.permission === 'admin'){
					appData.isModerator = true;
					appData.isAdmin = false;
				}				
				appData.noProjects = false;
			}else{
				appData.noProjects = true;
			}
			
		});
	};
	showAllUnapprovedProjects();

	appData.escalateButton = function(projectId, title){		
		//$('#projectId').val(projectId);
		$scope.title = title;
		$scope.projectId = projectId;
		//$('#title').val(title);
		$('#escalateProjectModal').modal({backdrop: 'static'});
	};

	appData.escalate = function(escalateData, title, projectId){
		appData.load = true;
		console.log(appData.escalateData);
		console.log(title+"  "+projectId);
		appData.escalateData.title = title;
		appData.escalateData.projectId = projectId;
		Project.escalate(appData.escalateData).then(function(data){
			appData.load = false;
			if(data.data.success){
				$('#escalateProjectModal').modal("hide");
				appData.successMsg = data.data.message;
				showAllUnapprovedProjects();
				$timeout(function() {                    
                    appData.successMsg = false; // Clear success message                    
                }, 5000);
			}else{
				appData.errorMsg = data.data.message;
			}
		});
	}
});

