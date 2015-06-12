'use strict';

var uuid = require('uuid');
var async = require('async');
var express = require('express');
var exphbs  = require('express-handlebars');
var Riak = require('basho-riak-client');

var riakNodes = process.env.RIAK_NODES.split(',');
var port = process.env.PORT;
var client = new Riak.Client(riakNodes);
var clientId = uuid.v4();
var app = express();

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    client.fetchValue({
        bucket: 'clients',
        key: clientId,
        convertToJs: true
    }, function(err, result) {
        if (err) return res.render('index', {error: err});
        var value = null;
        if(result.isNotFound) {
            value = { counter: 1 };
        } else {
            var riakObject = result.values.shift();
            var oldValue = riakObject.value.counter;
            riakObject.setValue({counter: oldValue+1});
            value = riakObject;
        }
        client.storeValue({
            bucket: 'clients',
            key: clientId,
            value: value,
            convertToJs: true,
            returnBody: true
        }, function(err, result) {
            if (err) return res.render('index', {error: err});
            var counter = result.values.shift().value.counter;
            res.render('index', {clients: [{clientId: clientId, counterValue: counter}]});
        });
    });

});

app.get('/all', function (req, res) {
    client.listKeys({
        bucket: 'clients',
        stream: false
    },
    function (err, result) {
        if(err) return res.end(err);
        var results = {};
        async.mapSeries(result.keys.sort(),
            function (key, callback) {
                client.fetchValue({
                    bucket: 'clients',
                    key: key,
                    convertToJs: true
                },
                function (err, result) {
                    if(err) return callback(err);
                    callback(null, {
                        clientId: key,
                        counterValue: result.values.shift().value.counter
                    });
                });
        }, function (err, results) {
            if(err) return res.end(err);
            res.render('index', {clients: results});
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
