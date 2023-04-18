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
exports.db_updateDBbyUplink = exports.db_updateEditableFields = exports.db_getEntries = void 0;
const mongodb_1 = require("mongodb");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Returns MongoClient
function getClient() {
    return __awaiter(this, void 0, void 0, function* () {
        return new mongodb_1.MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority`);
    });
}
// Get DB enties and saves them in temp
function db_getEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
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
exports.db_getEntries = db_getEntries;
// Updates the editable fields 
function db_updateEditableFields(_id, item) {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
        try {
            yield client.connect();
            const collection = client.db("lorawan_data").collection("sensor_data");
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
exports.db_updateEditableFields = db_updateEditableFields;
// Updates a db entrie or add a new one. Triggert by TTN Uplink
function db_updateDBbyUplink(_devEUI, data, base_data) {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield getClient();
        try {
            // Get db entrie by given dev_eui and save it in result
            yield client.connect();
            const collection = client.db("lorawan_data").collection("sensor_data");
            let result = yield collection.find({ "dev_eui": _devEUI }).toArray();
            // No db entrie was found
            if (result.length == 0) {
                let obj = JSON.parse(JSON.stringify(data));
                let res = yield collection.insertOne(obj
                /*{
                // Always there
                time: <string> obj.time,
                dev_eui: <string> obj.dev_eui,
                name: <string> obj.name,
                gateway: <string> obj.gateway,
                rssi: <number> obj.rssi,
                // Sensor data
                air_temperature: <number> obj.air_temperature,
                air_humidity: <number> obj.air_humidity,
                soil_temperature: <string> obj.soil_temperature,
                soil_humidity: <string> obj.soil_humidity,
                distance: <number> obj.distance,
                // Editable fields
                max_distance: <number> obj.max_distance,
                hum_min: <number> obj.hum_min,
                hum_max: <number> obj.hum_max,
                description: <string> obj.description,
                watering_time: <string> obj.watering_time,*/
                // Always there 
                /*time:`${obj.time}`,
                dev_eui:`${obj.dev_eui}`,
                name:`${obj.name}`,
                gateway:`${obj.gateway}`,
                rssi:`${obj.rssi}`,
                // Sensor data
                air_temperature:`${obj.air_temperature}`,
                air_humidity:`${obj.air_humidity}`,
                soil_temperature:`${obj.soil_temperature}`,
                soil_humidity:`${obj.soil_humidity}`,
                distance:`${obj.distance}`,
                // Editable fields
                max_distance: `${obj.max_distance}`,
                hum_min: `${obj.hum_min}`,
                hum_max: `${obj.hum_max}`,
                description:`${obj.description}`,
                watering_time:`${obj.watering_time}`
            }*/
                );
                console.log("Generated new db entrie with id: " + res.insertedId);
            }
            else {
                // if there is a db entry, get id from entrie and update
                let res_obj = JSON.parse(JSON.stringify(result));
                let obj = JSON.parse(JSON.stringify(base_data));
                let res = yield collection.updateOne({ "_id": new mongodb_1.ObjectId(res_obj[0]._id) }, obj
                /*{
                $set:{
                gateway:`${obj.gateway}`,
                time:`${obj.time}`,
                dev_eui:`${obj.dev_eui}`,
                rssi:`${obj.rssi}`},
                // Sensor data
                air_temperature:`${obj.air_temperature}`,
                air_humidity:`${obj.air_humidity}`,
                soil_temperature:`${obj.soil_temperature}`,
                soil_humidity:`${obj.soil_humidity}`,
                distance:`${obj.distance}`
            }*/ );
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
exports.db_updateDBbyUplink = db_updateDBbyUplink;
