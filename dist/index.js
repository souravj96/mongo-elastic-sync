"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var elasticsearch_1 = require("@elastic/elasticsearch");
var mongodb_1 = require("mongodb");
var Sync = /** @class */ (function () {
    function Sync(mongoURL, elasticURL, option) {
        this.option = {
            prefix: "auto-sync-",
            debug: false,
        };
        this.mongoURL = mongoURL;
        this.elasticURL = elasticURL;
        if (option) {
            this.option = option;
        }
    }
    Sync.prototype.startSync = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.initElastic()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.initMongo()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.initWatcher()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Sync.prototype.initElastic = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client;
            return __generator(this, function (_a) {
                try {
                    client = new elasticsearch_1.Client({
                        node: this.elasticURL,
                    });
                    if (!client) {
                        throw new Error("Failed to connect elastic server");
                    }
                    if (this.option.debug)
                        console.log("Debug: Connected to elastic");
                    this.ESclient = client;
                }
                catch (error) {
                    if (this.option.debug)
                        console.log("Debug: Failed to connect elastic");
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    Sync.prototype.initMongo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, mongodb_1.MongoClient.connect(this.mongoURL)];
                    case 1:
                        client = _a.sent();
                        if (!client) {
                            throw new Error("Failed to connect mongodb server");
                        }
                        if (this.option.debug)
                            console.log("Debug: Connected to mongodb");
                        this.db = client.db();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Failed to connect mongodb");
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Sync.prototype.initWatcher = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    this.db
                        .watch({ fullDocument: "updateLookup" })
                        .on("change", function (data) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            if (this.option.debug)
                                console.log("Debug: Change event triggered");
                            this.generateOperation(data);
                            return [2 /*return*/];
                        });
                    }); });
                }
                catch (error) {
                    if (this.option.debug)
                        console.log("Debug: Error in change event");
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    Sync.prototype.generateOperation = function (data) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var id, body, index, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        index = ((_a = this === null || this === void 0 ? void 0 : this.option) === null || _a === void 0 ? void 0 : _a.prefix) + data.ns.coll.toLowerCase();
                        _b = data.operationType;
                        switch (_b) {
                            case "delete": return [3 /*break*/, 1];
                            case "insert": return [3 /*break*/, 3];
                            case "update": return [3 /*break*/, 5];
                            case "drop": return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1:
                        id = data.documentKey._id;
                        return [4 /*yield*/, this.deleteDataOnElastic(id, index)];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 10];
                    case 3:
                        body = data.fullDocument;
                        id = body === null || body === void 0 ? void 0 : body._id;
                        if (id) {
                            delete body._id;
                        }
                        return [4 /*yield*/, this.createDataOnElastic(id, index, body)];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 10];
                    case 5:
                        body = data.fullDocument;
                        id = body === null || body === void 0 ? void 0 : body._id;
                        if (id) {
                            delete body._id;
                        }
                        return [4 /*yield*/, this.updateDataOnElastic(id, index, body)];
                    case 6:
                        _c.sent();
                        return [3 /*break*/, 10];
                    case 7: return [4 /*yield*/, this.dropIndexOnElastic(index)];
                    case 8:
                        _c.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        console.log("ERROR: mongo-elastic-sync: Unhandled operation ".concat(data.operationType, ", log it here: https://github.com/souravj96/mongo-elastic-sync/issues"));
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    Sync.prototype.dropIndexOnElastic = function (index) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ESclient.indices.delete({
                                index: index,
                            })];
                    case 1:
                        _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Elastic index dropped");
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Failed to drop index");
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Sync.prototype.deleteDataOnElastic = function (id, index) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ESclient.delete({
                                index: index,
                                id: id,
                            })];
                    case 1:
                        _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Elastic index deleted");
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Failed to delete index");
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Sync.prototype.updateDataOnElastic = function (id, index, body) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ESclient.update({
                                index: index,
                                refresh: true,
                                id: id,
                                body: {
                                    doc: body,
                                },
                            })];
                    case 1:
                        _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Elastic index updated");
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Failed to update index");
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Sync.prototype.createDataOnElastic = function (id, index, body) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.ESclient.index({
                                index: index,
                                id: id,
                                body: body,
                            })];
                    case 1:
                        _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Elastic index created");
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        if (this.option.debug)
                            console.log("Debug: Failed to create index");
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return Sync;
}());
module.exports = {
    Sync: Sync,
};
