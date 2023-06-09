"use strict";
const { Sync } = require("../dist");
require("dotenv").config();

const autoSyncObject = new Sync(
  process.env.MONGO_URL,
  process.env.ELASTIC_URL,
  { prefix: "update-test-", initialSync: true, debug: false }
);

autoSyncObject.startSync();
