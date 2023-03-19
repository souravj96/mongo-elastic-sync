# Mongodb to Elasticsearch Auto-sync

---

`mongo-elastic-sync` allows automatic transfer of data from a MongoDB database to an Elasticsearch index. This process is typically used when there is a need to search and analyze data stored in MongoDB using Elasticsearch, which is a powerful search and analytics engine.

## Features

---

⭐ `startSync()` function will automatically sync every mongodb change event to elastic server

## Install

---

```
npm i mongo-elastic-sync
```

## Quick start

---

```
"use strict";
const { Sync } = require("mongo-elastic-sync");
require("dotenv").config();

const autoSyncObject = new Sync(
    process.env.MONGO_URL,
    process.env.ELASTIC_URL,
);

autoSyncObject.startSync();
```

you can use your own custom prefix for elastic index

```
const autoSyncObject = new Sync(
  process.env.MONGO_URL,
  process.env.ELASTIC_URL,
  { prefix: "update-test-" }
);
```