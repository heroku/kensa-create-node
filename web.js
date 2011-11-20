var express = require('express');
var crypto  = require('crypto');
var http    = require('http');
var fs      = require('fs');

var resources = [];

function get_resource(id) {
 id = parseInt(id)
 for (i in resources) {
   if(resources[i].id == id){
     return resources[i] 
   }
 }
}

function destroy_resource(id) {
 id = parseInt(id)
 for (i in resources) {
   if(resources[i].id == id){
     delete resources[i] 
   }
 }
}

function basic_auth (req, res, next) {
  if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
    // fetch login and password
    if (new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString() == 
        process.env.HEROKU_USERNAME + ':' + process.env.HEROKU_PASSWORD) {
      next();
      return;
    }
  }
  console.log('Unable to authenticate user');
  console.log(req.headers.authorization);
  res.header('WWW-Authenticate', 'Basic realm="Admin Area"');
  res.send('Authentication required', 401);
}

function sso_auth (req, res, next) {
  if(req.params.length == 0){
    var id = req.param('id');
  }else{
    var id = req.params.id;
  }
  console.log(id)
  console.log(req.params)
  var pre_token = id + ':' + process.env.SSO_SALT + ':' + req.param('timestamp')
  var shasum = crypto.createHash('sha1')
  shasum.update(pre_token)
  var token = shasum.digest('hex')
  if( req.param('token') != token){
    res.send("Token Mismatch", 403);
    return;
  }
  var time = (new Date().getTime() / 1000) - (2 * 60);
  if( parseInt(req.param('timestamp')) < time ){
    res.send("Timestamp Expired", 403);
    return;
  }
  res.cookie('heroku-nav-data', req.param('nav-data'))
  req.session.resource = get_resource(id)
  req.session.email = req.param('email')
  next();
}

var app = express.createServer(express.logger());

app.configure(function(){
  app.use(express.cookieParser());
  app.use(express.session({ secret: process.env.SSO_SALT }));
})

//Provision
app.post('/heroku/resources', express.bodyParser(), basic_auth, function(request, response) {
  console.log(request.body)
  var resource =  {id : resources.length + 1, plan : request.body.plan }
  resources.push(resource)
  response.send(resource)
});

//Plan Change
app.put('/heroku/resources/:id', express.bodyParser(), basic_auth, function(request, response) {
  console.log(request.body)
  console.log(request.params) 
  var resource =  get_resource(request.params.id)
  if(!resource){
    response.send("Not found", 404);
    return;
  }
  resource.plan = request.body.plan
  response.send("ok")
})

//Deprovision
app.delete('/heroku/resources/:id', basic_auth, function(request, response) {
  console.log(request.params)
  if(!get_resource(request.params.id)){
    response.send("Not found", 404);
    return;
  }
  destroy_resource(request.params.id)
  response.send("ok")
})

//GET SSO
app.get('/heroku/resources/:id', sso_auth, function(request, response) {
  response.redirect("/")
})

//POST SSO
app.post('/sso/login', express.bodyParser(), sso_auth, function(request, response){
  response.redirect("/")
})

//SSO LANDING PAGE
app.get('/', function(request, response) {
  if(request.session.resource){
    response.render('index.ejs', {layout: false, 
      resource: request.session.resource, email: request.session.email })
  }else{
    response.send("Not found", 404);
  }
});

var port = process.env.PORT || 4567;
app.listen(port, function() {
  console.log("Listening on " + port);
});
