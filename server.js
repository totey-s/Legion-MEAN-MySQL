var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();
var appRoutes = require('./app/routes/api')(router);
var path = require('path');
var moment = require('moment');

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

var AccessTable = sequelize.define('accessLog', {
  id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  loginTime: Sequelize.DATE, 
  logoutTime: {type: Sequelize.DATE, defaultValue: null}
});

var UserTable = sequelize.define('user', {
  userId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    firstname: Sequelize.STRING,
    lastname: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,   
    username: Sequelize.STRING,
    permission: {type: Sequelize.STRING, allowNull: false, defaultValue: 'user'},
    active: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
});

var ProjectTable = sequelize.define('projects', {
  projectId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    username: Sequelize.STRING,
    title:  Sequelize.STRING,
    description: Sequelize.STRING,
    category: Sequelize.STRING,   
    address: Sequelize.STRING,
    goal: Sequelize.INTEGER,
    duration: Sequelize.INTEGER,
    complete: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
    authorized: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0},
    escalate: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
    escalateReason: {type: Sequelize.STRING}
});

UserTable.hasMany(AccessTable, {
  foreignKey: 'userId',
  constraints: false,
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

//Adding record of janedoe to table 'user'.
/*
sequelize.sync().then(function() {
  return User.create({
    username: 'janedoe',
    birthday: new Date(1980, 6, 20)
  });
}).then(function(jane) {
  console.log(jane.get({
    plain: true
  }));
});
*/
//-----------------------------------------------------------------------------------------------

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname+"/public"));
app.use('/api', appRoutes);

//http://localhost:8080/api/users

/*
mongoose.connect('mongodb://localhost:27017/kickstarter');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Successfully Connected to mongodb");
});
*/

app.get('*', function(req,res){
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.listen(port);
console.log("Running the server on port: "+port);