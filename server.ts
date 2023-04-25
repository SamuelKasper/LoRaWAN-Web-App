import express from "express";
import * as dotenv from "dotenv";
import { db_getEntries, db_updateDBbyUplink, db_updateEditableFields } from "./db";
import https from "https";
const app = express();

// Middleware
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
// Use dotenv
dotenv.config();

// Global variables
let waiting: boolean = false;
let timeoutID: NodeJS.Timeout;
let default_time = "08:00";
let last_time = default_time;
let default_min = 30;
let default_max = 75;
let default_max_distance = 200;

// Loading data from DB and displays it on default URL
app.get('/', async (req, res) => {
    let entries = await db_getEntries() || [];

    for (let i = 0; i < entries.length; i++) {
        // Calculate percentage for distance
        if (entries[i].distance) {
            let max: number = entries[i].max_distance * 10;
            let dist: number = entries[i].distance;
            let percent: number = dist / max * 100;
            let percent_str: string = percent.toFixed(1);
            entries[i].distance = percent_str + "% (" + dist / 10 + "cm)";
            // Add message if zistern water level is below 10%
            if (percent < 10) {
                entries[i].distance += " | Wasserstand gering!";
            }
        }
    }

    // Render the page with given entries
    res.render("index", { entries });
});

// Receives the uplink data and processes it
app.post('/uplink', async (req, res) => {
    // Respond to ttn. Otherwise the uplink will fail.
    res.sendStatus(200);

    // Parse request body into a jsonObj.
    let jsonObj = JSON.parse(JSON.stringify(req.body));

    // Only process uplinks with a decoded payload
    if (jsonObj.uplink_message.decoded_payload) {
        // Add all data to their specific fields. Some fields will be undefined.
        let sensorData = jsonObj.uplink_message.decoded_payload;
        let data: DB_entrie = {
            // Data other than enviroment data
            name: <string>jsonObj.end_device_ids.device_id,
            gateway: <string>jsonObj.uplink_message.rx_metadata[0].gateway_ids.gateway_id,
            time: jsonObj.received_at.toLocaleString('de-DE'),
            dev_eui: <string>jsonObj.end_device_ids.dev_eui,
            rssi: <number>jsonObj.uplink_message.rx_metadata[0].rssi,
            description: "Beschreibung...",

            // Air, just sends the Data without °C and %
            air_temperature: <number>sensorData.TempC_SHT,
            air_humidity: <number>sensorData.Hum_SHT,

            // Soil, sensor sends also °C and %!
            soil_temperature: <string>sensorData.temp_SOIL,
            soil_humidity: <string>sensorData.water_SOIL,

            // Waterlevel, measured by distance
            distance: <number>sensorData.distance,
        };

        // Delete entries with value undefined 
        for (const [key, val] of Object.entries(data)) {
            if (val == undefined) {
                delete data[key as keyof typeof data];
            }
        }

        // No added fields like hum_min, hum_max, watering_time, max_distance
        let base_data = data;

        // Set db values or init values for the editable fields
        let entries = await db_getEntries() || [];
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
        await db_updateDBbyUplink(data.dev_eui, data, base_data);

        // Check for necessary downlink if the sensor ist a soil sensor
        if (data.soil_humidity) {
            //checkDownlink(data);
            prepareDownlink(data);
        }
    }
});

// Receives and updates the user input fields
app.post('/update', async (req, res) => {
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
    } else if (req.body.max_distance) {
        entrie = {
            description: req.body.description.toString(),
            max_distance: parseInt(req.body.max_distance),
        };
        // Update data of other sensors without special fields
    } else {
        entrie = {
            description: req.body.description.toString(),
        };
    }

    // Update db
    await db_updateEditableFields(req.body.dbid, entrie);

    // Reloade page
    res.redirect('back');
});

// Checking if watering is needed
async function prepareDownlink(data: DB_entrie) {
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
                } else { console.log("Downlink already scheduled"); }
            } else {
                // Delete former Timeout
                clearTimeout(timeoutID);
                // Schedule downlink
                scheduleDownlink(data);
            }
            //Check if humidity is above max-value
        } else if (humidity >= data.hum_max) {
            sendDownlink(1); // Turns the relais off
            console.log("Downlink to stop pump");
        }
        // Set new value for the last watering time
        last_time = data.watering_time;
    }
}

// Scheduling a downlink
function scheduleDownlink(data: DB_entrie) {
    // Get waiting time
    if (data.watering_time) {
        const waiting_time = calculateWaitingTime(data.watering_time);
        // Wait a specific time before running sendDownlink
        timeoutID = setTimeout(function () {
            sendDownlink(0); // Turns the relais on
        }, waiting_time);
        // Set waiting indicator to true
        waiting = true;
        console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time/1000/60).toFixed(1)} min left.`)
    }
}

// Calculate and then wait for specific time
// Returns in [0] a value for displaying the time left and in [1] the ms left
function calculateWaitingTime(_watering_time: string) {
    // Split input into hours and minutes
    let splitted_time: string[] = _watering_time.split(":");
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
    let time_left: number = 0;
    let ms_per_day = 86400000;
    if (watering_time_millisecs > now_millisecs) {
        time_left = watering_time_millisecs - now_millisecs;
    } else {
        time_left = watering_time_millisecs - now_millisecs;
        time_left = ms_per_day + time_left;
    }
    return time_left;
}

/* Function for sending downlinks
 0 for relais on
 1 for relais off */
function sendDownlink(on_off: 1 | 0) {
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
        let req = https.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
        });

        req.on("error", (e) => {
            console.log(`Error: ${e.message}`);
        });

        // Write data to stream and close connection after
        req.write(data);
        req.end();
    } else {
        console.log("ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.");
    }

    // Reset waiting, so a new downlink can be sheduled
    console.log("Set waiting to false.");
    waiting = false;
}


app.listen(8000);
