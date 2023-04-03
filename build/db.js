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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDBbyUplink = exports.updateDB = exports.getEntries = void 0;
const mongodb_1 = require("mongodb");
// returns MongoClient
function getClient() {
    return __awaiter(this, void 0, void 0, function* () {
        return new mongodb_1.MongoClient("mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority");
    });
}
//Get DB enties and saves them in temp
function getEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
        try {
            yield client.connect();
            const db_entries = client.db("lorawan_data").collection("sensor_data");
            let entries = yield db_entries.find().toArray();
            entries.forEach(entrie => {
                entrie.time = new Date(entrie.time).toLocaleString("de-DE");
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
exports.getEntries = getEntries;
// Updates a db entrie
function updateDB(_id, item) {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
        try {
            yield client.connect();
            const collection = client.db("lorawan_data").collection("sensor_data");
            // der hier drunter geht nicht
            yield collection.updateOne({ "_id": new mongodb_1.ObjectId(_id) }, { $set: item });
        }
        catch (e) {
            console.error(e);
        }
        finally {
            yield client.close();
        }
    });
}
exports.updateDB = updateDB;
// Updates a db entrie or adds a new one. Called by ttn uplink.
function updateDBbyUplink(_dev_eui, item) {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
        try {
            // connect to db and get collection object
            yield client.connect();
            const collection = client.db("lorawan_data").collection("sensor_data");
            // get the db entrie by looking at the dev_eui
            let result = yield collection.find({ "dev_eui": _dev_eui }).toArray();
            // if theres no db entrie, make a new one
            if (result.length == 0) {
                let obj = JSON.parse(JSON.stringify(item));
                let res = yield collection.insertOne({
                    gateway: `${obj.gateway}`, temperature: `${obj.temperature}`, humidity: `${obj.humidity}`,
                    time: `${obj.time}`, dev_eui: `${obj.dev_eui}`, name: `${obj.name}`,
                    watering_amount: `${obj.watering_amount}`, watering_time: `${obj.watering_time}`, rssi: `${obj.rssi}`
                });
                console.log("Generated new entrie with id: " + res.insertedId);
            }
            else {
                // if there is a db entry, get id from entrie and update
                let res_obj = JSON.parse(JSON.stringify(result));
                let obj = JSON.parse(JSON.stringify(item));
                let res = yield collection.updateOne({ "_id": new mongodb_1.ObjectId(res_obj[0]._id) }, { $set: {
                        gateway: `${obj.gateway}`, temperature: `${obj.temperature}`, humidity: `${obj.humidity}`,
                        time: `${obj.time}`, dev_eui: `${obj.dev_eui}`, rssi: `${obj.rssi}`
                    } } /*{$set: item}*/);
                console.log("found: " + res.matchedCount + " entrie.", "\nupdated id: " + res_obj[0]._id);
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
exports.updateDBbyUplink = updateDBbyUplink;
