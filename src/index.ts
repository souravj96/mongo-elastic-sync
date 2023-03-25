"use strict";

import { Client } from "@elastic/elasticsearch";
import { MongoClient } from "mongodb";

interface Option {
  prefix: string;
  initialSync: boolean;
  debug: boolean;
}

class Sync {
  db: any;
  ESclient: any;
  mongoURL: string;
  elasticURL: string;
  option: Option = {
    prefix: "auto-sync-",
    initialSync: true,
    debug: false,
  };

  constructor(mongoURL: string, elasticURL: string, option: Option) {
    this.mongoURL = mongoURL;
    this.elasticURL = elasticURL;
    if (option) {
      this.option = option;
    }
  }

  async initialSync() {
    try {
      if (!this.ESclient) await this.initElastic();
      if (!this.db) await this.initMongo();
      if (this.option.debug) console.log("Debug: Initial mongodb sync started");
      await this.initDbSync();
    } catch (error) {
      if (this.option.debug) throw error;
      else return;
    }
  }

  async startSync() {
    try {
      if (!this.ESclient) await this.initElastic();
      if (!this.db) await this.initMongo();
      if (this.option.initialSync) await this.initialSync();
      await this.initWatcher();
    } catch (error) {
      if (this.option.debug) throw error;
      else return;
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

  private async initDbSync() {
    try {
      let collectionsArr = await this.db.listCollections().toArray();
      let collection = collectionsArr.map((ele: any) =>
        ele.type === "collection" ? ele.name : null
      );
      for (let i = 0; i < collection.length; i++) {
        let coll = collection[i];
        let index = this?.option?.prefix + coll.toLowerCase();
        if (coll) {
          let allData = await this.db.collection(coll).find().toArray();
          await this.createBulkDataOnElastic(index, allData);
        }
      }
    } catch (error) {
      if (this.option.debug)
        console.log("Debug: Failed to initial sync mongodb");
      throw error;
    }
  }

  private async initWatcher() {
    try {
      return new Promise((resolve: any, reject: any) => {
        this.db
          .watch({ fullDocument: "updateLookup" })
          .on("change", async (data: any, error: any) => {
            try {
              if (error) reject(error);
              if (this.option.debug)
                console.log("Debug: Change event triggered");
              await this.generateOperation(data);
              resolve();
            } catch (error) {
              if (this.option.debug)
                console.log("Debug: Error in change event");
              reject(error);
            }
          });
      });
    } catch (error) {
      if (this.option.debug) console.log("Debug: Error in change event");
      throw error;
    }
  }

  private async generateOperation(data: any) {
    try {
      let id, body;
      let index = this?.option?.prefix + data.ns.coll.toLowerCase();
      switch (data.operationType) {
        case "delete":
          id = data.documentKey._id;
          await this.deleteDataOnElastic(id, index);
          break;

        case "insert":
          body = data.fullDocument;
          id = body?._id;
          if (id) {
            delete body._id;
          }
          await this.createDataOnElastic(id, index, body);
          break;

        case "update":
          body = data.fullDocument;
          id = body?._id;
          if (id) {
            delete body._id;
          }
          await this.updateDataOnElastic(id, index, body);
          break;

        case "drop":
          await this.dropIndexOnElastic(index);
          break;

        default:
          console.log(
            `ERROR: mongo-elastic-sync: Unhandled operation ${data.operationType}, log it here: https://github.com/souravj96/mongo-elastic-sync/issues`
          );
          break;
      }
    } catch (error) {
      throw error;
    }
  }

  private async dropIndexOnElastic(index: string) {
    try {
      await this.ESclient.indices.delete({
        index: index,
      });

      if (this.option.debug) console.log("Debug: Elastic index dropped");
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to drop index");
      throw error;
    }
  }

  private async deleteDataOnElastic(id: string, index: string) {
    try {
      await this.ESclient.delete({
        index: index,
        id: id,
      });

      if (this.option.debug) console.log("Debug: Elastic index deleted");
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to delete index");
      throw error;
    }
  }

  private async updateDataOnElastic(id: string, index: string, body: object) {
    try {
      await this.ESclient.update({
        index: index,
        refresh: true,
        id: id,
        body: {
          doc: body,
          doc_as_upsert: true,
        },
      });

      if (this.option.debug) console.log("Debug: Elastic index updated");
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to update index");
      throw error;
    }
  }

  private async createDataOnElastic(id: string, index: string, body: object) {
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

  private async createBulkDataOnElastic(index: string, body: any[]) {
    try {
      const data = body.flatMap((doc: any) => {
        let id = doc?._id;
        if (id) {
          delete doc._id;
        }
        return [{ index: { _index: index, _id: id }, doc }];
      });
      await this.ESclient.bulk({
        refresh: true,
        body: data,
      });

      if (this.option.debug)
        console.log("Debug: Elastic bulk index created: " + index);
    } catch (error) {
      if (this.option.debug) console.log("Debug: Failed to create bulk index");
      throw error;
    }
  }
}

module.exports = {
  Sync,
};
