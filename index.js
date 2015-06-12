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

app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: ".hbs"
}));
app.set('view engine', 'hbs');

app.get('/', function (req, res) {
    getCounterValue(clientId, function(err, result) {
        if (err) return res.render('error', {error: err});
        res.render('index', {
            clientId: clientId,
            counter: result ? result.value.counter : 0
        });
    });
});

app.get('/counter', function (req, res) {
    getCounterValue(clientId, function(err, result) {
        if (err) return res.render('error', {error: err});
        var value = null;
        if(!result) {
            value = { counter: 1 };
        } else {
            var oldValue = result.value.counter;
            result.setValue({counter: oldValue+1});
            value = result;
        }
        client.storeValue({
            bucket: 'clients',
            key: clientId,
            value: value,
            convertToJs: true,
            returnBody: true
        }, function(err, result) {
            if (err) return res.render('error', {error: err});
            res.redirect('/');
        });
    });

});

app.get('/all', function (req, res) {
    client.listKeys({
        bucket: 'clients',
        stream: false
    },
    function (err, result) {
        if (err) return res.render('error', {error: err});
        var results = {};
        async.mapSeries(result.keys.sort(),
            function (key, callback) {
                getCounterValue(key, function (err, result) {
                    if(err) return callback(err);
                    callback(null, {
                        clientId: key,
                        counterValue: result.value.counter
                    });
                });
        }, function (err, results) {
            if (err) return res.render('error', {error: err});
            res.render('counters', {clients: results});
        });

    });

});

function getCounterValue (clientId, callback) {
    client.fetchValue({
        bucket: 'clients',
        key: clientId,
        convertToJs: true
    }, function(err, result) {
        if(err) return callback(err);
        callback(null, result.values.shift());
    });
}

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
