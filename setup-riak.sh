#!/bin/bash
RIAK_CONTAINER=$(docker-compose ps -q riak)
docker exec $RIAK_CONTAINER riak-admin bucket-type create counters '{"props":{"datatype":"counter"}}'
docker exec $RIAK_CONTAINER riak-admin bucket-type activate counters