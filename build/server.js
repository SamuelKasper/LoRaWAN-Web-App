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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const db_1 = require("./db");
const https_1 = __importDefault(require("https"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.static("views"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.set("view engine", "ejs");
// Use dotenv
dotenv.config();
// Global variables
let waiting = false;
let timeoutID;
let default_time = "08:00";
let last_time = default_time;
let default_min = 30;
let default_max = 75;
let default_max_distance = 200;
// Loading data from DB and displays it on default URL
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let entries = (yield (0, db_1.db_getEntries)()) || [];
    for (let i = 0; i < entries.length; i++) {
        // Calculate percentage for distance
        if (entries[i].distance) {
            let max = entries[i].max_distance * 10;
            let dist = entries[i].distance;
            let percent = dist / max * 100;
            let percent_str = percent.toFixed(1);
            entries[i].distance = percent_str + "% (" + dist / 10 + "cm)";
            // Add message if zistern water level is below 10%
            if (percent < 10) {
                entries[i].alert = "warning";
            }
        }
    }
    // Render the page with given entries
    res.render("index", { entries });
}));
// Receives the uplink data and processes it
app.post('/uplink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let entries = (yield (0, db_1.db_getEntries)()) || [];
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].dev_eui == data.dev_eui) {
                // Add editable fields for soil if data is from soil sensor
                if (data.soil_humidity) {
                    data.hum_min = entries[i].hum_min ? entries[i].hum_min : default_min;
                    data.hum_max = entries[i].hum_max ? entries[i].hum_max : default_max;
                    data.watering_time = entries[i].watering_time ? entries[i].watering_time : default_time;
                }
                // Add editable fields for distance if data is from distance sensor
                if (data.distance) {
                    data.max_distance = entries[i].max_distance ? entries[i].max_distance : default_max_distance;
                }
            }
        }
        // Update db 
        yield (0, db_1.db_updateDBbyUplink)(data.dev_eui, data, base_data);
        // Check for necessary downlink if the sensor ist a soil sensor
        if (data.soil_humidity) {
            //checkDownlink(data);
            prepareDownlink(data);
        }
    }
}));
// Receives and updates the user input fields
app.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let entrie = {};
    // Update data of soil sensor
    if (req.body.watering_time) {
        entrie = {
            description: req.body.description.toString(),
            watering_time: req.body.watering_time.toString(),
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
    yield (0, db_1.db_updateEditableFields)(req.body.dbid, entrie);
    // Reloade page
    res.redirect('back');
}));
// Checking if watering is needed
function prepareDownlink(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if needed data is available
        if (data.soil_humidity != undefined && data.watering_time != undefined
            && data.hum_min != undefined && data.hum_max != undefined) {
            // Check soil humidity and call sendDownlink() if needed
            const humidity = parseInt(data.soil_humidity.replace("%", ""));
            // Check if humidity is below min-value
            if (humidity <= data.hum_min) {
                // Check if watering time has changed
                if (last_time == data.watering_time) {
                    // Check if downlink is already scheduled
                    if (!waiting) {
                        scheduleDownlink(data);
                    }
                    else {
                        console.log("Downlink already scheduled");
                    }
                }
                else {
                    // Delete former Timeout
                    clearTimeout(timeoutID);
                    // Schedule downlink
                    scheduleDownlink(data);
                }
                //Check if humidity is above max-value
            }
            else if (humidity >= data.hum_max) {
                sendDownlink(1); // Turns the relais off
                console.log("Downlink to stop pump");
            }
            // Set new value for the last watering time
            last_time = data.watering_time;
        }
    });
}
// Scheduling a downlink
function scheduleDownlink(data) {
    // Get waiting time
    if (data.watering_time) {
        const waiting_time = calculateWaitingTime(data.watering_time);
        // Wait a specific time before running sendDownlink
        timeoutID = setTimeout(function () {
            sendDownlink(0); // Turns the relais on
        }, waiting_time);
        // Set waiting indicator to true
        waiting = true;
        console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`);
    }
}
// Calculate and then wait for specific time
// Returns in [0] a value for displaying the time left and in [1] the ms left
function calculateWaitingTime(_watering_time) {
    // Split input into hours and minutes
    let splitted_time = _watering_time.split(":");
    let hours = parseInt(splitted_time[0]);
    let minutes = parseInt(splitted_time[1]);
    // Set watering time values
    let watering_time = new Date();
    watering_time.setHours(hours - 2);
    watering_time.setMinutes(minutes);
    watering_time.setSeconds(0);
    watering_time.setMilliseconds(0);
    // Calculate hours, minutes and seconds
    let now = new Date();
    let now_millisecs = Date.parse(now.toString());
    let watering_time_millisecs = Date.parse(watering_time.toString());
    let time_left = 0;
    let ms_per_day = 86400000;
    if (watering_time_millisecs > now_millisecs) {
        time_left = watering_time_millisecs - now_millisecs;
    }
    else {
        time_left = watering_time_millisecs - now_millisecs;
        time_left = ms_per_day + time_left;
    }
    return time_left;
}
/* Function for sending downlinks
 0 for relais on
 1 for relais off */
function sendDownlink(on_off) {
    console.log("just startet sendDownlink");
    // Only allow downlink while ENABLE_DOWNLINK is set to true
    if (process.env.ENABLE_DOWNLINK == "true") {
        let app1 = "kaspersa-hfu-bachelor-thesis";
        let wh1 = "webapp";
        let dev1 = "eui-70b3d57ed005c853";
        // Prepare payload data
        let data = JSON.stringify({
            "downlinks": [{
                    "decoded_payload": {
                        "on_off": on_off
                    },
                    "f_port": 15,
                    "priority": "NORMAL"
                }]
        });
        // Preparing POST options
        let options = {
            host: `eu1.cloud.thethings.network`,
            path: `/api/v3/as/applications/${app1}/webhooks/${wh1}/devices/${dev1}/down/push`,
            method: "POST",
            headers: {
                "Authorization": `${process.env.AUTH_TOKEN}`,
                "Content-type": "application/json;",
                "User-Agent": "webapp/1.0",
                "Connection": "keep-alive",
                "Content-Length": Buffer.byteLength(data),
                "accept": "*/*",
            },
        };
        // Create request object
        let req = https_1.default.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
        });
        req.on("error", (e) => {
            console.log(`Error: ${e.message}`);
        });
        // Write data to stream and close connection after
        req.write(data);
        req.end();
    }
    else {
        console.log("ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.");
    }
    // Reset waiting, so a new downlink can be sheduled
    console.log("Set waiting to false.");
    waiting = false;
}
app.listen(8000);
