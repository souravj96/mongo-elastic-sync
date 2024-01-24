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
  indexCount: number = 0;
  failedIndexCount: number = 0;
  dataCount: number = 0;
  failedDataCount: number = 0;

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
      // if (this.option.debug)
      console.log(
        `Info: Initial mongodb sync completed with index=> ${this.indexCount} success and ${this.failedIndexCount} failed ||  data=> ${this.dataCount} success and ${this.failedDataCount} failed`
      );
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

      const promises = collection.map(async (coll: any) => {
        if (coll) {
          let index = this?.option?.prefix + coll.toLowerCase();
          try {
            let allData = await this.db.collection(coll).find().toArray();
            if (Array.isArray(allData) && allData.length > 0) {
              await this.createBulkDataOnElastic(index, allData);
            } else {
              await this.createIndexOnElastic(index);
            }
            this.indexCount++;
          } catch (error) {
            this.failedIndexCount++;
            if (this.option.debug) {
              console.error(`Error: Failed to process collection ${coll}`);
            }
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      if (this.option.debug) {
        console.log("Debug: Failed to initial sync mongodb");
      }
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

  private async indexExists(index: string) {
    try {
      const { body: exists } = await this.ESclient.indices.exists({
        index,
      });
      if (this.option.debug)
        console.log("Info: Elastic index already exists => ", index);
      return true;
    } catch (error) {
      if (this.option.debug)
        console.error(`Error checking if index "${index}" exists:`, error);
      return false;
    }
  }

  private async createIndexOnElastic(index: string) {
    try {
      const exists = await this.indexExists(index);

      if (!exists) {
        await this.ESclient.indices.create({
          index,
          body: {},
        });

        if (this.option.debug)
          console.log("Info: Elastic index created => ", index);
      }
    } catch (error) {
      if (this.option.debug)
        console.error("Error: Failed to create index => ", index);
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

      if (this.option.debug) console.log("Info: Elastic index created");
    } catch (error) {
      if (this.option.debug) console.error("Error: Failed to create index");
      throw error;
    }
  }

  private async createBulkDataOnElastic(index: string, body: any[]) {
    try {
      const batchSize = 1000;
      const totalDocs = body.length;

      const promises = [];
      for (let i = 0; i < totalDocs; i += batchSize) {
        try {
          const batch = body.slice(i, i + batchSize);

          const data = batch.flatMap((doc: any) => {
            let id = doc?._id?.toString();
            if (id) {
              delete doc._id;
            }
            return [{ index: { _index: index, _id: id } }, doc];
          });

          const promise = this.ESclient.bulk({
            refresh: true,
            body: data,
          });

          promises.push(promise);
          this.dataCount += batch.length;

          if (this.option.debug) {
            console.log(
              `Info: Queued batch ${
                i + batch.length
              } out of ${totalDocs} documents for processing ${index}`
            );
          }
        } catch (error) {
          this.failedDataCount += batchSize;
          if (this.option.debug) {
            console.error(`Error: Failed to process data`);
          }
        }
      }
      await Promise.all(promises);

      if (this.option.debug) {
        console.log("Info: Elastic bulk index created: " + index);
      }
    } catch (error) {
      if (this.option.debug) {
        console.error("Error: Failed to create bulk index");
      }
      throw error;
    }
  }
}

module.exports = {
  Sync,
};
