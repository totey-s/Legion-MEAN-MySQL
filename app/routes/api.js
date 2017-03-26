var User = require('../models/user');
var jwt = require('jsonwebtoken');
var secret = 'kickstarter';
var bcrypt = require('bcrypt-nodejs');

//------------------------------------Braintree Payment Gateway --- Step 1------------------------------------
var braintree = require("braintree");

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "f7jpbz5x8ct8bd4j",
  publicKey: "9krzyxh6gv4jxnc7",
  privateKey: "33b0ed542b06ef053b1270e1d30d59b9"
});
//--------------------------------------------------------------------------------------------------

//-------------------------------------MySQL Connection---------------------------------------------
var Sequelize = require('sequelize');
var mysql = require('mysql');

var sequelize = new Sequelize('legion', 'root', 'root', {
  host: "localhost",
  port: 3306
});

sequelize.authenticate().then(function(err){
	if(err){
		console.log('Unable to connect to the database:', err);
	}else{
		console.log('Connection has been established successfully.');
	}
});

var UserTable = sequelize.define('user', {
	userId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  	firstname: Sequelize.STRING,
  	lastname:	Sequelize.STRING,
  	email: Sequelize.STRING,
  	password:	Sequelize.STRING,	  
  	username: Sequelize.STRING,
  	permission: {type: Sequelize.STRING, allowNull: false, defaultValue: 'user'},
  	active: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
});

var ProjectTable = sequelize.define('projects', {
	projectId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  	username: Sequelize.STRING,
  	title:	Sequelize.STRING,
  	description: Sequelize.STRING,
  	category:	Sequelize.STRING,	  
  	address: Sequelize.STRING,
  	goal: Sequelize.INTEGER,
  	duration: Sequelize.INTEGER,
  	complete: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
  	authorized: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0},
  	escalate: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
  	escalateReason: {type: Sequelize.STRING}
});

UserTable.hasMany(ProjectTable, {
	foreignKey: 'userId',
	constraints: false,
});

ProjectTable.belongsTo(UserTable, {
	foreignKey: 'userId'
});

var FundedProjects = sequelize.define('fundedprojects', {
	id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  	userId: Sequelize.STRING,
  	amount: Sequelize.INTEGER,
  	nameoncard: Sequelize.STRING,
  	addressoncard: Sequelize.STRING,
  	cityoncard: Sequelize.STRING,
  	pincodeoncard: Sequelize.INTEGER,
  	email: Sequelize.STRING,
  	cardNo: Sequelize.STRING,
  	cardExpiry: Sequelize.STRING 
});

FundedProjects.belongsTo(ProjectTable,{
	foreignKey: 'projectId'
});

//---------------------------------------------------------------------------------------------------

module.exports = function(router){

// -------------------Payment Gateway --- Step 2---------------------------
	router.get("/client_token", function (req, res) {
	  gateway.clientToken.generate({}, function (err, response) {
	    res.send(response.clientToken);
	  });
	});
// -------------------Payment Gateway --- Step 3----------------------------
	router.post("/checkout", function (req, res) {
		console.log("in checkout");
		console.log(req.body.payload);

	//--------------Braintree Payment--------------------
	 //  gateway.transaction.sale({
		//   amount: '10.00',
		//   paymentMethodNonce: req.body.payload,
		//   options: {
		//     submitForSettlement: true
		//   }
		// }, function (err, result) {
		//   if (err) {
		//     console.error(err);
		//     return;
		//   }
		 
		//   if (result.success) {
		//     console.log('Transaction ID: ' + result.transaction.id);
		//     console.log('Transaction status: ' + result.transaction.status);
		//     console.log('Transaction paymentInstrumentType : ' + result.transaction.paymentInstrumentType);
		//     console.log(result.transaction);
		//   } else {
		//     console.error(result.message);
		//   }
		// });
	  //-----------------------------------------------------------------------
	});
// -------------------Payment Gateway --- Step 4-----------------------------
	
//----------------------------------------------------------------------------


	//http://localhost:8080/users
	//USER REGISTRATION ROUTE
	router.post('/users', function(req, res){	
		var user = new User();
		console.log(req.body);
		user.username = req.body.username;
		user.password = req.body.password;
		bcrypt.hash(user.password, null, null, function(err, hash){
		    if(err) console.log(err);
		    user.password = hash;		
		    console.log("Encrypted Pass: "+hash);		    
		    console.log("Encrypted Pass: "+user.password);
		  });
		user.email = req.body.email;
		user.fname = req.body.fname;
		user.lname = req.body.lname;
		if(req.body.username==null || req.body.username=='' || req.body.password==null || req.body.password=='' || 
			req.body.email==null || req.body.email=='' || req.body.fname==null || req.body.fname==''){
			//res.send("NO Data provided");
			res.json({success:false, message: 'No Data provided'});
		}else{			
			//-------------------Save in MySQL---------------------------------------------------------------------------------------------			
			sequelize.sync().then(function() {				
			  return UserTable.create({			  	
			    firstname: user.fname,
			 	lastname:	user.lname,
			  	email: user.email,
			  	password: user.password,	  
			  	username: user.username
			  });
			}).then(function(record) {
			  console.log(record.get({
			    plain: true
			  }));
			  console.log("UserId: "+record.userId);
			  var token = jwt.sign({ userId: record.userId, fname: user.fname, lname: user.lname, username: user.username, email: user.email, active: user.active}, secret, {expiresIn: '24h'});
			  res.json({success:true, message:'User Created successfully', token: token});
			});
			//-----------------------------------------------------------------------------------------------------------------------------
		}
	});

	router.post('/checkusername', function(req, res){
		//--------------------------MySQL------------------------------------------------------------
		UserTable.find({
		  where: {username: req.body.username},
		  attributes: ['username']
		}).then(function(userData){
			if(userData){
				res.json({success: false, message: 'That Username is already taken.'});
			}else{
				res.json({success: true, message: 'Valid Username'})
			}
		});
		//-------------------------------------------------------------------------------------------
	});

	router.post('/checkemail', function(req, res){
		//--------------------------MySQL------------------------------------------------------------
		UserTable.find({
		  where: {email: req.body.email},
		  attributes: ['email']
		}).then(function(userData){
			if(userData){
				res.json({success: false, message: 'An account with this email already exists.'});
			}else{
				res.json({success: true, message: 'Valid Username'})
			}
		});
		//-------------------------------------------------------------------------------------------
	});

	//USER LOGIN ROUTE
	//http://localhost:8080/api/authenticate
	router.post('/authenticate', function(req, res){
		console.log("Authenticating....")		
		//-----------------Find in MySQL----------------------------------------------------------------------
		UserTable.find({
		  where: {username: req.body.username, active: true}
		}).then(function(userData) {
			//console.log(userData.dataValues);
			//console.log("Password: "+userData.dataValues.password);
			if(userData){
				bcrypt.compare(req.body.password, userData.dataValues.password, function(err, match) {
				    //console.log(match);
				    if(!match){
						res.json({success:false, message:'Could not authenticate password'});
					}
					else
					{
						var token = jwt.sign({ userId:userData.dataValues.userId, fname: userData.dataValues.firstname, lname: userData.dataValues.lastname, username: userData.dataValues.username, 
							email: userData.dataValues.email, permission: userData.dataValues.permission, active: userData.dataValues.active }, 
							secret, {expiresIn: '24h'});
						//console.log(token);
						res.json({success:true, message:'User Authenticated!', token: token});
					}
				});
			} else{
				res.json({success:false, message:'Incorrect Username or Password.'});
			}
			
		}).catch(function(err){
			if(err) throw err;
		});		
		//----------------------------------------------------------------------------------------------------
	});


	router.use(function(req, res, next){
		console.log("in router Use");
		console.log(req.url);
		var token = req.body.token || req.body.query || req.headers['x-access-token'];
		if(token){
			jwt.verify(token, secret, function(err, decoded){
				if(err){
					res.json({ success:false, message:'Token Invalid' });		
				}else{
					req.decoded = decoded;
					next();
				}
			});
		}else{
			//--------------Experiment--------------------
			if(req.headers.referer.includes('exploreProjects') || req.url === '/getTopProjects'){
				next();
			}else
			//--------------------------------------------			
			res.json({ success:false, message:'No token provided' });
		}
	});

	router.post('/me', function(req, res){
		res.send(req.decoded);
	});	

	router.get('/renewToken/:username', function(req, res){
		UserTable.find({
		  where: {username: req.params.username, active: true}
		}).then(function(userData) {
			if(!userData){
				res.json({ success: false, message: 'No user was found' });
			} else{
				var newtoken = jwt.sign({ fname: userData.dataValues.firstname, lname: userData.dataValues.lastname, username: userData.dataValues.username,
					email: userData.dataValues.email, permission: userData.dataValues.permission, active: userData.dataValues.active }, 
					secret, {expiresIn: '24h'});
				//console.log(token);
				res.json({success:true, token: newtoken});
			}
		});
	});

	router.get('/permission', function(req, res){
		//------------------MySQL--------------------------------------------------
		UserTable.find({
		  where: {username: req.decoded.username, active: true}
		}).then(function(userData) {
			if(!userData){
				res.json({ success: false, message: 'No user was found' });
			} else{
				res.json({ success: true, permission: userData.permission});
			}
		});
		//---------------------------------------------------------------------------
	});

	router.get('/management', function(req, res){	
		console.log("Current Permission: "+req.decoded.permission);
		//-------------------------MySQL---------------------------------------------------------------
		if(req.decoded.permission == 'admin' || req.decoded.permission == 'moderator'){
			UserTable.findAll().then(function(users) {
				
					if(!users){
						//console.log("No Users");
						res.json({ success: false, message: 'No users was found' });
					} else{
						//console.log("Users found");
						res.json({success: true, users: users, permission: req.decoded.permission, curUser: req.decoded.username});
					}				
			});
		}else{
				res.json({success: false, message: 'Insufficient Privileges'});
			}
		//---------------------------------------------------------------------------------------------
	});

	router.delete('/management/:username', function(req, res){
		var deletedUser = req.params.username;
		//-------------------------MySQL---------------------------------------------------------------
		UserTable.find({
		  where: {username: deletedUser, active: true}
		}).then(function(userData){
			if(userData){
				userData.updateAttributes({
					active:false
				}).then(function(){
					res.json({success: true});
				});
			}
		});
		//---------------------------------------------------------------------------------------------
	});

	router.get('/edit/:id', function(req, res){
		var editUser = req.params.id;
		var permission =  req.decoded.permission;
		//-------------------------MySQL---------------------------------------------------------------
		if(permission === 'admin' || permission === 'moderator'){
			UserTable.find({
			  where: {userId: editUser}
			}).then(function(userData) {
				if(!userData){
					res.json({ success: false, message: 'No user was found' });
				} else{
					console.log(userData.dataValues);
					res.json({ success: true, user: userData.dataValues});
				}
			});
		}else{
			res.json({success: false, message: 'Insufficient Privileges'});	
		}		
		//---------------------------------------------------------------------------------------------
	});

	 router.put('/edit', function(req, res) {
	 	console.log("In '/edit'");
	 	var editUser = req.body._id;
	 	var permission =  req.decoded.permission;
	 	console.log(req.decoded.username+" : "+permission)
	 	//console.log(req.body._id+" "+req.body.fname);
	 	if(req.body.fname) var newfname = req.body.fname;
	 	if(req.body.lname) var newlname = req.body.lname;
		if(req.body.username) var newUsername = req.body.username;	 	
		if(req.body.email) var newEmail = req.body.email;	 
		if (req.body.permission) var newPermission = req.body.permission; 
		//-------------------------MySQL---------------------------------------------------------------
		if(newfname || newlname){
			if(permission === 'admin' || permission === 'moderator'){
				UserTable.find({
				  where: {userId: editUser}
				}).then(function(userData){
					if(userData){
						userData.updateAttributes({
							firstname:newfname, 
							lastname:newlname
						}).then(function(){
							res.json({success:true, message: "Name has been updated"});
						}).catch(function(err){
							if(err) throw err;
						});
					}
				}).catch(function(err){
					if(err) throw err;
				});
			}else{				
				res.json({success: false, message: 'Insufficient Privileges'});	
			}
		}
		if(newUsername){
			if(permission === 'admin' || permission === 'moderator'){
				UserTable.find({
				  where: {userId: editUser}
				}).then(function(userData){
					if(userData){
						userData.updateAttributes({
							username:newUsername
						}).then(function(){
							res.json({success:true, message: "Username has been updated"});
						}).catch(function(err){
							if(err) throw err;
						});
					}
				}).catch(function(err){
					if(err) throw err;
				});
			}else{				
				res.json({success: false, message: 'Insufficient Privileges'});	
			}
		}
		if(newEmail){
			console.log("In newEmail");
			if(permission === 'admin' || permission === 'moderator'){
				console.log("in If for admin or moderator");
				UserTable.find({
				  where: {userId: editUser}
				}).then(function(userData){
					if(userData){
						userData.updateAttributes({
							email:newEmail
						});
						return res.json({success:true, message: "Email has been updated"});						
					}else{
						return res.json({ success: false, message: 'No user found' }); // Return error
					}
				});
			}else{				
				res.json({success: false, message: 'Insufficient Privileges'});	
			}
		}
		if(newPermission){
			console.log("In Permissions");
			if(permission === 'admin' || permission === 'moderator'){
				UserTable.find({
				  where: {userId: editUser}
				}).then(function(userData){
					//console.log(userData);
					if(userData){
						// Check if attempting to set the 'user' permission
                        if (newPermission === 'user') {
                            // Check the current permission is an admin
                            if (userData.permission === 'admin') {
                                // Check if user making changes has access
                                if (permission !== 'admin') {
                                    res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade an admin.' }); // Return error
                                } else {
                                    //user.permission = newPermission; // Assign new permission to user
                                    // Save changes
                                    userData.updateAttributes({
										permission:newPermission
									}).then(function(){
										res.json({success:true, message: "Permissions have been updated"});
									}).catch(function(err){
										if(err) throw err;
									}); 
                                }
                            } else {
                                //user.permission = newPermission; // Assign new permission to user
                                // Save changes
                                userData.updateAttributes({
									permission:newPermission
								}).then(function(){
									res.json({success:true, message: "Permissions have been updated"});
								}).catch(function(err){
									if(err) throw err;
								});                                
                            }
                        }
                        // Check if attempting to set the 'moderator' permission
                        if (newPermission === 'moderator') {
                            // Check if the current permission is 'admin'
                            if (userData.permission === 'admin') {
                                // Check if user making changes has access
                                if (permission !== 'admin') {
                                    res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade another admin' }); // Return error
                                } else {
                                    //user.permission = newPermission; // Assign new permission
                                    // Save changes
                                    userData.updateAttributes({
										permission:newPermission
									}).then(function(){
										res.json({success:true, message: "Permissions have been updated"});
									}).catch(function(err){
										if(err) throw err;
									});                                   
                                }
                            } else {
                                //user.permission = newPermission; // Assign new permssion
                                // Save changes
                                userData.updateAttributes({
									permission:newPermission
								}).then(function(){
									res.json({success:true, message: "Permissions have been updated"});
								}).catch(function(err){
									if(err) throw err;
								});
                            }
                        }
                        // Check if assigning the 'admin' permission
                        if (newPermission === 'admin') {
                            // Check if logged in user has access
                            if (permission === 'admin') {                                
                                // Save changes
                                userData.updateAttributes({
									permission:newPermission
								}).then(function(){
									res.json({success:true, message: "Permissions have been updated"});
								}).catch(function(err){
									if(err) throw err;
								});
                            } else {
                                res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level' }); // Return error
                            }
                        }
					}else{
						res.json({ success: false, message: 'No user found' }); // Return error
					}
				}).catch(function(err){
					if(err) throw err;
				});
			}else{							
				res.json({success: false, message: 'Insufficient Privileges'});	
			}
		}
		//---------------------------------------------------------------------------------------------
	 });

router.post('/addProject', function(req, res){			
		console.log(req.body);
		var title = req.body.title;
		var description = req.body.description;
		var category = req.body.category.name;
		var address = req.body.address;
		var goal = req.body.goal;
		var duration = req.body.duration;
		var username = req.decoded.username;
		console.log("UserId: "+req.decoded.userId);
		sequelize.sync().then(function() {				
		  return ProjectTable.create({			  	
		    username: username,
		 	title:	title,
		  	description: description,
		  	category: category,	  
		  	address: address,
		  	goal: goal,
		  	duration: duration,
		  	userId: req.decoded.userId
		  });
		}).then(function(record) {
		  console.log(record.get({
		    plain: true
		  }));		  
		  res.json({success:true, message:'Project Created successfully'});
		}).catch(function(err){
			if(err) throw err;
		});		
	});

router.get('/getAllApprovedProjects', function(req, res){
	//console.log("in API getAllApprovedProjects");
		sequelize.query('SELECT u.firstname, u.lastname, u.username, p.projectId, p.title, p.description, p.category,'+ 
		'p.address, p.goal, p.duration, p.createdAt FROM projects as p inner join users as u WHERE p.authorized = 1 and p.userId = u.userId', 
		{type: sequelize.QueryTypes.SELECT}).then(function(projects){
			//console.log(projects);
			if(projects){
				if(req.decoded === undefined){
					res.json({success: true, projects: projects});
				}else{
					res.json({success: true, projects: projects, curUser: req.decoded.username});	
				}				
			}else{
				res.json({success: false, message: "No Projects Found"});
			}
		}).catch(function(err){
			if(err) console.log(err);
		});	
		
	/*
	ProjectTable.findAll({
	  where: {
	  	authorized: 1,
	  	userId: {
	  		$ne: req.decoded.userId
	  	}
	  }
	}).then(function(projects){
		if(projects){
			console.log(projects.dataValues)
			res.json({success: true, projects: projects});
		}else{
			res.json({success: false, message: "No Projects Found"});
		}
	}).catch(function(err){
		if(err) console.log(err);
	});	
	*/
});

router.get('/getAllUserProjects', function(req, res){
	ProjectTable.findAll({
	  where: {userId: req.decoded.userId}
	}).then(function(projects){
		if(projects){
			console.log(projects.dataValues)
			res.json({success: true, projects: projects});
		}else{
			res.json({success: false, message: "No Projects Found"});
		}
	}).catch(function(err){
		if(err) console.log(err);
	});
	
});

router.get('/getAllUnapproved', function(req, res){
	console.log("Permission: "+req.decoded.permission);
	if(req.decoded.permission === 'admin'){
		ProjectTable.findAll({
		  where: {
		  	authorized: 0,
		  	escalate: true,
		  }
		}).then(function(projects){
			if(projects){
				console.log(projects.dataValues)
				res.json({success: true, projects: projects, permission: req.decoded.permission});
			}else{
				res.json({success: false, message: "No Projects Found"});
			}
		}).catch(function(err){
			if(err) console.log(err);
		});
	}else if(req.decoded.permission === 'moderator'){
		ProjectTable.findAll({
		  where: {authorized: 0}
		}).then(function(projects){
			if(projects){
				console.log(projects.dataValues)
				res.json({success: true, projects: projects, permission: req.decoded.permission});
			}else{
				res.json({success: false, message: "No Projects Found"});
			}
		}).catch(function(err){
			if(err) console.log(err);
		});
	}
	
	
});

router.post('/approveProject', function(req, res){
	console.log("/approveProject----"+req.body.id);
	//res.json({success: true, message: req.body.id+' has been authorized.'});
		
	ProjectTable.find({
		where: {projectId: req.body.id}
	}).then(function(projectData){
		if(projectData){
			projectData.updateAttributes({
				authorized:1
			}).then(function(){
				res.json({success: true, message: projectData.dataValues.title+' has been authorized.'});
			});
		} else{
			res.json({success: false, message: "No such Project Found"});
		}
	}).catch(function(err){
		if(err) console.log(err);
	});
	
});

router.post('/escalate', function(req, res){
	ProjectTable.find({
		where: {projectId: req.body.projectId}
	}).then(function(projectData){
		if(projectData){
			projectData.updateAttributes({
				escalate:true,
				escalateReason: req.body.reason
			}).then(function(){
				res.json({success: true, message: projectData.dataValues.title+' has been escalated.'});
			});
		} else{
			res.json({success: false, message: "No such Project Found"});
		}
	}).catch(function(err){
		if(err) console.log(err);
	});
	
});

router.post('/decline', function(req, res){
	ProjectTable.find({
		where: {projectId: req.body.id}
	}).then(function(projectData){
		if(projectData){
			projectData.updateAttributes({
				authorized:-1
			}).then(function(){
				res.json({success: true, message: projectData.dataValues.title+' has been declined.'});
			});
		} else{
			res.json({success: false, message: "No such Project Found"});
		}
	}).catch(function(err){
		if(err) console.log(err);
	});
});

router.post("/pay", function (req, res) {
	console.log("in checkout");
	console.log(req.body);
	sequelize.sync().then(function() {				
		  return FundedProjects.create({	
		  	projectId: req.body.projectId,
		    amount: req.body.amount,
		    userId: req.decoded.userId,
		  	nameoncard: req.body.cardInfo.fname+" "+req.body.cardInfo.lname,
		  	addressoncard: req.body.cardInfo.address,
		  	cityoncard: req.body.cardInfo.city,
		  	pincodeoncard: req.body.cardInfo.zipcode,
		  	email: req.body.cardInfo.email,
		  	cardNo: req.body.cardInfo.cardno,
		  	cardExpiry: req.body.cardInfo.expiry
		  });
		}).then(function(record) {
		  // console.log(record.get({
		  //   plain: true
		  // }));		  
		  res.json({success:true, message:'Payment Done successfully. Thank you for your contribution.'});
		}).catch(function(err){
			if(err) throw err;
		});	
});

router.get('/getAllFunded', function(req, res){
	console.log("in getAllFunded");
	sequelize.query('SELECT p.title, p.description, p.category, p.address, f.amount, f.nameoncard, f.createdAt FROM fundedprojects as f inner join projects as p WHERE f.userId=:userId and p.projectId = f.projectId', 
		{replacements: { userId: req.decoded.userId }, type: sequelize.QueryTypes.SELECT}
		).then(function(projects){
			console.log(projects);
			if(projects){
				res.json({success: true, projects: projects, curUser: req.decoded.username});								
			}else{
				res.json({success: false, message: "No Projects Found"});
			}
		}).catch(function(err){
			if(err) console.log(err);
		});	
});

router.get('/getTopProjects', function(req, res){
	console.log("in getTopProjects");
	sequelize.query('SELECT p.*, u.firstname, u.lastname from projects as p inner join users as u where p.authorized = 1 and p.userId = u.userId group by p.projectId order by p.createdAt DESC LIMIT 3', 
		{type: sequelize.QueryTypes.SELECT}
		).then(function(projects){
			//console.log(projects);
			if(projects){
				res.json({success: true, projects: projects});								
			}else{
				res.json({success: false, message: "No Projects Found"});
			}
		}).catch(function(err){
			if(err) console.log(err);
		});	
});
	return router;
}