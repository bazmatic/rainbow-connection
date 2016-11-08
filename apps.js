var Utils = require('./utils.js');
var Async = require('async');
const TABLE_NAME = 'app';

function handlePost (req, res) {
    var data = req.body;
    var result = {};
    
    if (data.id) {
        Async.parallel(
            [
                function _createDatabase(callback) {
                    Utils.rethink.dbCreate(data.id).run(Utils.rethinkConnection, function(err, data) {
                        result.database = data;
                        callback(err);
                    });  
                },
                function _addRecord(callback) {
                    result.record = data;
                    Utils.rethink.table(TABLE_NAME).insert(data).run(Utils.rethinkConnection, callback);
                }
                
            ],
            function(err) {
                Utils.handleResponse(err, result, res);
            }
        );
    }
    
}
exports.handlePost = handlePost;

/*
    Db.table('app').insert([
        { name: "William Adama", tv_show: "Battlestar Galactica",
          posts: [
            {title: "Decommissioning speech", content: "The Cylon War is long over..."},
            {title: "We are at war", content: "Moments ago, this ship received word..."},
            {title: "The new Earth", content: "The discoveries of the past few days..."}
          ]
        },
        { name: "Laura Roslin", tv_show: "Battlestar Galactica",
          posts: [
            {title: "The oath of office", content: "I, Laura Roslin, ..."},
            {title: "They look like us", content: "The Cylons have the ability..."}
          ]
        },
        { name: "Jean-Luc Picard", tv_show: "Star Trek TNG",
          posts: [
            {title: "Civil rights", content: "There are some words I've known since..."}
          ]
        }
    ]).run(DbConnection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    })
*/