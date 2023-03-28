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
exports.updateDB = exports.getFilteredEntries = exports.getEntries = void 0;
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
function getFilteredEntries(item) {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
        try {
            yield client.connect();
            const db_entries = client.db("lorawan_data").collection("sensor_data");
            //check item
            let itemObject = JSON.parse(JSON.stringify(item));
            let entries;
            if (itemObject.name != "") {
                //name (+type)
                entries = yield db_entries.find(itemObject).toArray();
                console.log("namecheck: ", entries);
            }
            else {
                delete itemObject["name"];
                if (itemObject.type) {
                    //type
                    entries = yield db_entries.find(itemObject).toArray();
                }
                else {
                    //nothing
                    entries = yield db_entries.find().toArray();
                }
            }
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
exports.getFilteredEntries = getFilteredEntries;
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
