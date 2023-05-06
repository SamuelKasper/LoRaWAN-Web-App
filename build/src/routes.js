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
exports.Routes = void 0;
const db_1 = require("./db");
const downlink_1 = require("./downlink");
class Routes {
    constructor() {
        this.default_min = 30;
        this.default_max = 75;
        this.default_max_distance = 200;
        this.default_time = "08:00";
        this.time_control = "true";
        this.downlink = new downlink_1.Downlink();
        this.db = new db_1.DB();
    }
    // Loading data from DB and displays it on default URL
    default(res) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = (yield this.db.getEntries()) || [];
            for (let i = 0; i < entries.length; i++) {
                // Calculate percentage for distance
                if (entries[i].distance) {
                    let max = entries[i].max_distance * 10;
                    let dist = entries[i].distance;
                    let percent = 100 - (dist / max * 100);
                    let percent_str = percent.toFixed(1);
                    entries[i].distance = `${percent_str} % (${(max - dist) / 10} cm)`;
                    // Add message if zistern water level is below 10%
                    if (percent < 10) {
                        entries[i].alert = "warning";
                    }
                }
            }
            // Render the page with given entries
            res.render("index", { entries });
        });
    }
    // Receives the uplink data and processes it
    uplink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Respond to ttn. Otherwise the uplink will fail.
            res.sendStatus(200);
            // Parse request body into a jsonObj.
            let jsonObj = JSON.parse(JSON.stringify(req.body));
            // Search for best RSSI 
            let sorted_gateways_by_rssi = jsonObj.uplink_message.rx_metadata.sort((data_1, data_2) => data_2.rssi - data_1.rssi);
            // Only process uplinks with a decoded payload
            if (jsonObj.uplink_message.decoded_payload) {
                // Add all data to their specific fields. Some fields will be undefined.
                let sensorData = jsonObj.uplink_message.decoded_payload;
                let data = {
                    // Data other than enviroment data
                    name: jsonObj.end_device_ids.device_id,
                    gateway: sorted_gateways_by_rssi[0].gateway_ids.gateway_id,
                    time: jsonObj.received_at.toLocaleString('de-DE'),
                    dev_eui: jsonObj.end_device_ids.dev_eui,
                    rssi: jsonObj.uplink_message.rx_metadata[0].rssi,
                    description: "Beschreibung...",
                    // Air, just sends the Data without °C and %
                    air_temperature: sensorData.TempC_SHT,
                    air_humidity: sensorData.Hum_SHT,
                    // Soil, sensor sends also °C and %!
                    soil_temperature: sensorData.temp_SOIL,
                    soil_humidity: sensorData.water_SOIL,
                    // Waterlevel, measured by distance
                    distance: sensorData.distance,
                };
                // Delete entries with value undefined 
                for (const [key, val] of Object.entries(data)) {
                    if (val == undefined) {
                        delete data[key];
                    }
                }
                // No added fields like hum_min, hum_max, watering_time, max_distance
                let base_data = data;
                // Set db values or init values for the editable fields
                let entries = (yield this.db.getEntries()) || [];
                for (let i = 0; i < entries.length; i++) {
                    if (entries[i].dev_eui == data.dev_eui) {
                        // Add editable fields for soil if data is from soil sensor
                        if (data.soil_humidity) {
                            data.hum_min = entries[i].hum_min ? entries[i].hum_min : this.default_min;
                            data.hum_max = entries[i].hum_max ? entries[i].hum_max : this.default_max;
                            data.watering_time = entries[i].watering_time ? entries[i].watering_time : this.default_time;
                            data.time_control = entries[i].time_control ? entries[i].time_control : this.time_control;
                        }
                        // Add editable fields for distance if data is from distance sensor
                        if (data.distance) {
                            data.max_distance = entries[i].max_distance ? entries[i].max_distance : this.default_max_distance;
                        }
                    }
                }
                // Update db 
                yield this.db.updateDBbyUplink(data.dev_eui, data, base_data);
                // Check for necessary downlink if the sensor ist a soil sensor
                if (data.soil_humidity) {
                    //checkDownlink(data);
                    this.downlink.prepare_downlink(data);
                }
            }
        });
    }
    // Receives and updates the user input fields
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let entrie = {};
            console.log(req.body);
            // Update data of soil sensor
            if (req.body.watering_time) {
                entrie = {
                    description: req.body.description.toString(),
                    watering_time: req.body.watering_time.toString(),
                    time_control: req.body.time_control ? req.body.time_control : "false",
                    hum_min: parseInt(req.body.hum_min),
                    hum_max: parseInt(req.body.hum_max),
                };
                // Update data of distance sensor
            }
            else if (req.body.max_distance) {
                entrie = {
                    description: req.body.description.toString(),
                    max_distance: parseInt(req.body.max_distance),
                };
                // Update data of other sensors without special fields
            }
            else {
                entrie = {
                    description: req.body.description.toString(),
                };
            }
            // Update db
            yield this.db.updateEditableFields(req.body.dbid, entrie);
            // Reloade page
            res.redirect('back');
        });
    }
}
exports.Routes = Routes;
