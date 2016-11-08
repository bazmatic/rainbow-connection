var Utils = require('./utils.js');
var Async = require('async');
var request = require('request');

const TABLE_NAME = 'source';

function handlePost (req, res) {
    handleWrite(req, res, false);
}
exports.handlePost = handlePost;

function handlePut (req, res) {
    handleWrite(req, res, true);
}
exports.handlePut = handlePut;

function handleWrite (req, res, update) {
    
    var inputData = req.body;
    var appConnection = null;
    var result = {};

    if (req.app) {
        Async.series(
            [
                function _makeConnection(callback) {
                    Utils.connectDb(req.app, function(err, conn) {
                        appConnection = conn;
                        callback(err);
                    });            
                },
                
                function _validate(callback) {
                    validate(req.app, inputData, appConnection, callback);
                },
                
                function _save(callback) {
                    inputData.app = req.app;
                   
                    if (update) {
                        var id = inputData.id;
                        //delete inputData.id;
                        Utils.rethink.table(TABLE_NAME).get(id).replace(inputData).run(Utils.rethinkConnection, function(err, data) {
                            result = data;
                            callback(err);
                        });
                    }
                    else {
                        Utils.rethink.table(TABLE_NAME).insert(inputData).run(Utils.rethinkConnection, function(err, data) {
                            result = data;
                            callback(err);
                        });
                    }
                }
            ],
            function(err) {
                Utils.handleResponse(err, result, res);
            }
        );
    } 
    else {
        Utils.handleResponse("Invalid app", null, res, 403 );
    }
}


function validate(app, data, connection, callback) {
    if (data && data.table) {
        Utils.rethink.db(app).tableList().run(connection).then(function(tables) {
            if (tables.indexOf(data.table) > -1) {
                callback(null);
            } 
            else {
                callback("No such table '"+data.table+"'")
            }
        });
    }
    else {
        callback("Missing field 'table'");
    }
}

function handleFetch(req, res) {
    var appConnection = null;
    var sourceRecord = {};
    var insertData = [];
    var result = {};

    if (req.app) {
        Async.series(
            [
                function _makeConnection(callback) {
                    Utils.connectDb(req.app, function(err, conn) {
                        appConnection = conn;
                        callback(err);
                    });            
                },
                
                function _get(callback) {

                    Utils.rethink.table(TABLE_NAME).get(req.params.sourceId).run(Utils.rethinkConnection, function(err, data) {
                        sourceRecord = data;
                        callback(err);
                    });
                },
                
                function _doFetch(callback) {
                    var options = {
                      url: sourceRecord.url,
                      headers: sourceRecord.headers || {}
                    };
                    if (sourceRecord.user && sourceRecord.password) {
                        options.headers.Authorization = 'Basic ' + new Buffer(sourceRecord.user + ':' + sourceRecord.password, 'utf8').toString('base64');  
                        request(options, function(err, res, data) {
                            data = JSON.parse(data);
                            if (data && data.results) {
                                insertData = data.results;
                            }
                            callback(err);
                        });
                    }
                },
                
                function _insertData(callback) {
                    Utils.rethink.table(sourceRecord.table).insert(insertData).run(appConnection, function(err, data) {
                        result = data;
                        callback(err);
                    });
                }
                
            ],
            function(err) {
                Utils.handleResponse(err, result, res);
            }
        );
    } 
    else {
        Utils.handleResponse("Invalid app", null, res, 403 );
    }
    
}
exports.handleFetch = handleFetch;