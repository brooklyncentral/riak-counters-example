'use strict';

var uuid = require('uuid');
var express = require('express');
var Riak = require('basho-riak-client');

var riakNodes = process.env.RIAK_NODES.split(',');
var client = new Riak.Client(riakNodes);

var clientId = uuid.v4();

var app = express();

client.storeBucketProps({
	bucketType: 'counters',
	bucket: 'clients',
	allowMult: true
},function (err, result) {
	if(err) throw new Error(err); 
});

app.get('/', function (req, res) {
	client.fetchCounter({
		bucketType: 'counters',
		bucket: 'clients',
		key: clientId
	},
   	function (err, result) {
   		if(err) res.end(err);
		client.updateCounter({
			bucketType: 'counters',
	        bucket: 'clients',
	        key: clientId,
	        increment: 1
	    },
		function(err, result) {
    		if(err) res.end(err);
			result.clientId = clientId;
			res.end(JSON.stringify(result));
		});
   		
    });
});


var server = app.listen(process.env.PORT, function () {

  	var gracefulExit = function () {
	    client.shutdown(function (state) {
	        if (state === Riak.Cluster.State.SHUTDOWN) {
	            process.exit();
	        }
    	});
	};

	process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

});
