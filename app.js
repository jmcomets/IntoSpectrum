// Module dependencies
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

// Application instance
var app = express();

// All environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon(path.join(__dirname, 'static/images/favicon.ico')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'static')));

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Base routes
app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
