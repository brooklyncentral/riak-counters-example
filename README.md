# HOWTO

## 1. Start Riak

...and create and activate counters bucket-type

```sh
docker compose up -d
RIAK_CONTAINER=$(docker-compose ps -q riak)
docker exec $RIAK_CONTAINER riak-admin bucket-type create counters '{"props":{"datatype":"counter"}}'
docker exec $RIAK_CONTAINER riak-admin bucket-type activate counters
```

## 2. Start the node app

```sh
PORT=3000 RIAK_NODES=$(boot2docker ip):8087 nodemon index.js
```

## 3. Hit the app and see it counting

```sh
open localhost:3000
```
# TODO

Dockerize the node app, too


