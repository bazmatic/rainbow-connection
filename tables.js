var Utils = require('./utils.js');
var Async = require('async');
const TABLE_NAME = 'app';

function handlePost (req, res) {
    var data = req.body;
    var connection = null;
    var results = []

    if (req.app) {
        Async.series(
            [
                function _makeConnection(callback) {
                    Utils.connectDb(req.app, function(err, conn) {
                        connection = conn;
                        callback(err);
                    
                    });            
                },
                
                function _createTables(callback) {
                    Async.eachSeries(
                        data,
                        function(tableName, subCallback) {
                            Utils.rethink.db(req.app).tableCreate(tableName).run(connection, function(err, data) {
                                results.push(data);
                                subCallback(err);
                            })       
                        },
                        callback
                    );

                }
                
            ],
            function(err) {
                Utils.handleResponse(err, results, res);
            }
        );
       

    } 
    else {
        Utils.handleResponse("Invalid app", null, res, 403 );
    }
   
    
    if (data.constructor == "Array") {
        Async.each

    }
    
}
exports.handlePost = handlePost;

function handleGetData(req, res) {
    var appConnection;
    var result = [];
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
                    Utils.rethink.db(req.app).table(req.params.table).run(appConnection, function(err, data) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            if (req.query && req.query.format && req.query.format == "sql") {
                                var commandList = [];
                                var schemaSql;
                                
                                data.each(function(err, record) {
                                    if (!err) {
                                        if (!schemaSql) {
                                            schemaSql = makeSqlTableCreateStatement(req.params.table, record);
                                            result.push(schemaSql);
                                        }
                                        result.push(makeSqlInsertStatement(req.params.table, record));                                        
                                    }
                                    /*else {
                                        errCount ++;
                                    }*/

                                    
                                }, callback);
                            }
                            else {
                                data.toArray(function(err, tableData) {
                                    result = tableData;
                                    callback(err);
                                });                                
                            }

                        }
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
exports.handleGetData = handleGetData;

function handlePostData(req, res) {
    var appConnection;
    var result = [];
    if (req.app) {
        Async.series(
            [
                function _makeConnection(callback) {
                    Utils.connectDb(req.app, function(err, conn) {
                        appConnection = conn;
                        callback(err);
                    });            
                },
                
                function _insert(callback) {
                    Utils.rethink.table(req.params.table).insert(req.body).run(appConnection, function(err, data) {
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
exports.handlePostData = handlePostData;


function makeSqlTableCreateStatement(table, record) {
    var sql = "CREATE TABLE " + table + "(";
    var fieldCount = 0;
    for (var fieldName in record) {
        if (fieldCount > 0) sql += ",";
        sql += fieldName + " TEXT";
        fieldCount ++;
    }
    sql += ");";
    return sql;
}

function makeSqlInsertStatement(table, record) {

    var fields = [];
    var values = [];
    for (var fieldName in record) {
        fields.push(fieldName);
        values.push(record[fieldName]);
    }
    var sql = "INSERT INTO TABLE " + table + "(";
    for (var i=0,fieldCount = 0; i<fields.length; i++) {
        if (fieldCount > 0) sql += ",";
        sql += fields[i];
        fieldCount ++;
    }
    sql += ") ";
    sql += "VALUES (";
    fieldCount = 0;
    for (i=0; i<fields.length; i++) {
        if (fieldCount > 0) sql += ",";
        sql += '`' + record[fields[i]] + '`';
        fieldCount ++;
    }
    sql += ");";
    return sql;   
}