# What?

This is basic node app talking to Riak and utilising it's CRDT counter datatype.

## 1. Start the Riak and node app containers

```sh
docker compose up -d
```

## 2. Setup Riak

This is needed to create and enable counters bucket-type.

```sh
./setup-riak.sh
```

## 3. Hit the app and see it counting

```sh
open $(boot2docker ip):3000
```

# TODO

* minimal UI
* allow listing all clients with counts
* remove manual Riak setup step somehow



