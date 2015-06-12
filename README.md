# Ignore this repos as it's WIP

# What?

This is basic node app talking to Riak

## 1. Start the Riak and node app containers

```sh
docker compose up -d
```

## 3. Hit the app

```sh
# create counter and increment by making more requests
open http://$(boot2docker ip):3000
# see all counters
open http://$(boot2docker ip):3000/all
```
