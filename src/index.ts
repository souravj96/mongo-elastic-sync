"use strict";

import { Client } from "@elastic/elasticsearch";
import { MongoClient } from "mongodb";

interface Option {
  prefix: string;
  debug: boolean;
}

class Sync {
  db: any;
  ESclient: any;
  mongoURL: string;
  elasticURL: string;
  option: Option = {
    prefix: "auto-sync-",
    debug: false,
  };

  constructor(mongoURL: string, elasticURL: string, option: Option) {
    this.mongoURL = mongoURL;
    this.elasticURL = elasticURL;
    if (option) {
      this.option = option;
    }
  }

  async startSync() {
    try {
      await this.initElastic();
      await this.initMongo();
      await this.initWatcher();
    } catch (error) {
      throw error;
    }
  }

  private async initElastic() {
    try {
      const client = new Client({
        node: this.elasticURL,
      });
      if (!client) {
        throw new Error("Failed to connect elastic server");
      }
      if (this.option.debug) console.log("Debug: Connected to elastic");
      this.ESclient = client;
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to connect elastic");
      throw error;
    }
  }

  private async initMongo() {
    try {
      const client = await MongoClient.connect(this.mongoURL);
      if (!client) {
        throw new Error("Failed to connect mongodb server");
      }
      if (this.option.debug) console.log("Debug: Connected to mongodb");
      this.db = client.db();
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to connect mongodb");
      throw error;
    }
  }

  private async initWatcher() {
    try {
      this.db
        .watch({ fullDocument: "updateLookup" })
        .on("change", async (data: any) => {
          if (this.option.debug) console.log("Debug: Change event triggered");
          let index = this?.option?.prefix + data.ns.coll.toLowerCase();
          let body = data.fullDocument;
          let id = body?._id;
          if (id) {
            delete body._id;
          }
          await this.saveDataToElastic(id, index, body);
        });
    } catch (error) {
      if (this.option.debug) console.log("Debug: Error in change event");
      throw error;
    }
  }

  private async saveDataToElastic(id: string, index: string, body: object) {
    try {
      await this.ESclient.index({
        index,
        id,
        body,
      });

      if (this.option.debug) console.log("Debug: Elastic index created");
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to create index");
      throw error;
    }
  }
}

module.exports = {
  Sync,
};
