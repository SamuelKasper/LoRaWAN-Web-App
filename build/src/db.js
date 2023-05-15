"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
const mongodb_1 = require("mongodb");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class DB {
    /** Returns a MongoClient Object. */
    get_client() {
        return __awaiter(this, void 0, void 0, function* () {
            return new mongodb_1.MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority`);
        });
    }
    /** Returns the DB entries. */
    get_entries() {
        return __awaiter(this, void 0, void 0, function* () {
            let client = yield this.get_client();
            try {
                yield client.connect();
                const db_entries = client.db("lorawan_data").collection("sensor_data");
                let entries = yield db_entries.find().toArray();
                entries.forEach(entrie => {
                    entrie.time = new Date(entrie.time).toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
                });
                return entries;
            }
            catch (e) {
                console.error(e);
            }
            finally {
                yield client.close();
            }
        });
    }
    /** Returns the DB entries. */
    get_entrie_by_field(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let client = yield this.get_client();
            try {
                yield client.connect();
                const db_entries = client.db("lorawan_data").collection("sensor_data");
                console.log("findOne: ", { dev_eui: `\"${data}\"` });
                let entrie = yield db_entries.findOne({ dev_eui: `\"${data}\"` });
                if (entrie) {
                    entrie.time = new Date(entrie.time).toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
                }
                return entrie;
            }
            catch (e) {
                console.error(e);
            }
            finally {
                yield client.close();
            }
        });
    }
    /** Updates the user input fields. */
    update_editable_fields(_id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let client = yield this.get_client();
            try {
                yield client.connect();
                const collection = client.db("lorawan_data").collection("sensor_data");
                yield collection.updateOne({ "_id": new mongodb_1.ObjectId(_id) }, { $set: data });
            }
            catch (e) {
                console.error(e);
            }
            finally {
                yield client.close();
            }
        });
    }
    /** Updates a db entry or add a new one. */
    update_db_by_uplink(_devEUI, data, base_data) {
        return __awaiter(this, void 0, void 0, function* () {
            let client = yield this.get_client();
            try {
                // Get db entrie by given dev_eui and save it in result
                yield client.connect();
                const collection = client.db("lorawan_data").collection("sensor_data");
                const result = yield collection.find({ "dev_eui": _devEUI }).toArray();
                // No db entrie was found
                if (result.length == 0) {
                    const insert_data = JSON.parse(JSON.stringify(data));
                    const res = yield collection.insertOne(insert_data);
                    console.log(`Generated new entrie with ID: ${res.insertedId}`);
                }
                else {
                    // if there is a db entry, get id from entrie and update
                    const obj_id = JSON.parse(JSON.stringify(result));
                    const insert_data = JSON.parse(JSON.stringify(base_data));
                    yield collection.updateOne({ "_id": new mongodb_1.ObjectId(obj_id[0]._id) }, { $set: insert_data });
                    console.log(`Updated entrie with ID: ${obj_id[0]._id}`);
                }
            }
            catch (e) {
                console.error(e);
            }
            finally {
                yield client.close();
            }
        });
    }
}
exports.DB = DB;
