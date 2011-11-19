var express = require('express');

var resources = [];

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
    if (req.headers.authorization) {
        setTimeout(function () {
            res.send('Authentication required', 401);
        }, 5000);
    } else {
        res.send('Authentication required', 401);
    }
}

var app = express.createServer(express.logger());

app.configure(function(){
  app.use(express.bodyParser());
})

app.get('/', function(request, response) {
    response.send('Hello World!');
});

app.post('/heroku/resources', basic_auth, function(request, response) {
  console.log(request.body)
  var resource =  {id : resources.length + 1, plan : request.body.plan }
  resources.push(resource)
  response.send(resource)
});

var port = process.env.PORT || 4567;
app.listen(port, function() {
    console.log("Listening on " + port);
});

