'use strict';

var uuid = require('uuid');
var async = require('async');
var express = require('express');
var Riak = require('basho-riak-client');

var riakNodes = process.env.RIAK_NODES.split(',');
var port = process.env.PORT;
var client = new Riak.Client(riakNodes);
var clientId = uuid.v4();
var app = express();

app.get('/', function (req, res) {
    client.updateCounter({
        bucketType: 'counters',
        bucket: 'clients',
        key: clientId,
        increment: 1
    },
    function(err, result) {
        if(err) return res.end(err);
        result.clientId = clientId;
        res.json(result);
    });

});

app.get('/all', function (req, res) {
    client.listKeys({
        bucketType: 'counters',
        bucket: 'clients',
        stream: false
    }, 
    function (err, result) {
        if(err) return res.end(err);
        var results = {};
        async.eachSeries(result.keys.sort(),
            function (key, callback) {
                client.fetchCounter({
                    bucketType: 'counters',
                    bucket: 'clients',
                    key: key
                },
                function (err, result) {
                    if(err) return callback(err);
                    results[key] = result.counterValue;
                    callback();
                });
        }, function (err) {
            if(err) return res.end(err);
            res.json(results);
        });

    });

});

var server = app.listen(port, function () {
    var gracefulExit = function () {
        client.shutdown(function (state) {
            if (state === Riak.Cluster.State.SHUTDOWN) {
                process.exit();
            }
        });
    };

    process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

});
