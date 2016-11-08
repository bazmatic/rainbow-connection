var Express = require('express');
var Http = require('http');
var BodyParser = require('body-parser');

var Apps = require('./apps.js');
var Tables = require('./tables.js');
var Sources = require('./sources.js');
var Utils = require('./utils.js');


//=== API
var api = Express();

api.use(BodyParser.json());
api.use(Utils.allowCrossDomain);
api.use(Utils.logRequest);
api.use(Utils.auth);

api.set('port', Utils.PORT);

api.get('/', function(req, res)
{
	res.status(200).send("Rainbow Collection 0.1");
});

api.post('/app', Apps.handlePost);
api.post('/table', Tables.handlePost);
//api.get('/table/:table', Tables.handleGet); //Return table metadata
api.get('/data/:table', Tables.handleGetData); //Return table data
api.post('/data/:table', Tables.handlePostData); //Return table data
api.post('/source', Sources.handlePost);
api.put('/source', Sources.handlePut);
api.get('/fetch/:sourceId', Sources.handleFetch);

//Start server
Http.createServer(api).listen(8081, process.env.IP, function(){
	console.log('Web service listening at', process.env.IP, 'on port', 8081);
});

//Exception safety net
process.on('uncaughtException', function(err) {
	// handle the error safely
	console.log("SAFETY NET", err.stack);
});


