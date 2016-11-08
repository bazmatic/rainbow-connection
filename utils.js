var rethink = require('rethinkdb');
exports.rethink = rethink;


var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH,FILE');
	//res.header('Access-Control-Allow-Headers', '*');//'Content-Type,userId,token');
	res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token');

	next();
};
exports.allowCrossDomain = allowCrossDomain;

var logRequest = function(req, res, next) {
	console.log(req.ip, req.originalUrl);
	next();
};
exports.logRequest = logRequest;

function handleResponse(err, data, res, errCode)
{
	if (err)
	{
		if (!errCode)
		{
			errCode = 500;
		}
		res.status(errCode).json({"error": err});
	}
	else
	{
		if (data)
		{
			if (data.toJSON)
			{
				data = data.toJSON();
			}
			res.status(200).json(data);
		}
		else
		{
			res.status(404).json({"error": "Item not found"});
		}
	}
}
exports.handleResponse = handleResponse;

function auth(req, res, next) {
    req.app = req.get('app');
    next();
}
exports.auth = auth;

function connectDb(dbName, callback) {
  rethink.connect( {host: 'localhost', port: 28015, db: dbName}, callback);
}
exports.connectDb = connectDb;

connectDb("rainbow", function(err, conn) {
    if (err) throw err;
    exports.rethinkConnection = conn;
});

