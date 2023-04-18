import express from "express";
import * as dotenv from "dotenv";
import { db_getEntries, db_updateDBbyUplink, db_updateEditableFields } from "./db";
import https from "https";
import { json } from "stream/consumers";
const app = express();
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
dotenv.config();

// Show db entries on load
app.get('/', async (req, res) => {
    let entries = await db_getEntries() || [];

    // Calculate percentage for distance
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].distance) {
            let max:number = entries[i].max_distance * 10;
            let dist:number = entries[i].distance;
            let percent:number = entries[i].distance / max * 100;
            let percent_str:string = percent.toFixed(1);
            entries[i].distance = percent_str + "% (" + dist / 10 + "cm)";
            // Add message if zistern water level is below 10%
            if(percent<10){
                entries[i].distance += " | Achtung, das Wasser ist fast aufgebraucht!";
            }
        }
    }
    // Render the page with given entries
    res.render("index", { entries });
});

// If recieved uplink from webhook
app.post('/uplink', async (req, res) => {
    // Respond to ttn. Otherwise the uplink will fail.
    res.sendStatus(200);

    // Parse request body into a jsonObj.
    let jsonObj = JSON.parse(JSON.stringify(req.body));
    // Use dev_eui as identifier to get the mongodb id later
    let dev_eui = jsonObj.end_device_ids.dev_eui;
    
    // Add all data to their specific fields. Some fields will be undefined.
    let sensorData = jsonObj.uplink_message.decoded_payload;
    let data: DbEntrie = {
        // Data other than enviroment data
        name: <string>jsonObj.end_device_ids.device_id,
        gateway: <string>jsonObj.uplink_message.rx_metadata[0].gateway_ids.gateway_id,
        time: jsonObj.received_at.toLocaleString('de-DE'),
        dev_eui: <string>jsonObj.end_device_ids.dev_eui,
        rssi: <number>jsonObj.uplink_message.rx_metadata[0].rssi,
        description: "Beschreibung...",

        // Air, just sends the Data without °C and %
        air_temperature: <number> sensorData.TempC_SHT,
        air_humidity: <number> sensorData.Hum_SHT,

        // Soil, sensor sends also °C and %!
        soil_temperature: <string>sensorData.temp_SOIL,
        soil_humidity: <string>sensorData.water_SOIL,

        // Waterlevel, measured by distance
        distance: <number> sensorData.distance,
    };

    // Delete entries with value undefined 
    for(const[key,val] of Object.entries(data)){
        if(val == undefined){
            delete data[key as keyof typeof data];
        }
    }

    // No added fields like hum_min, hum_max, watering_time, max_distance
    let base_data = data;

    // Add editable fields for soil if data is from soil sensor
    if(data.soil_humidity){
        data.hum_min = 30;
        data.hum_max = 80;
        data.watering_time = "08:00";
    }
    // Add editable fields for distance if data is from distance sensor
    if(data.distance){
        data.max_distance = 200;
    }
   
    console.log(data);

    // Update db 
    await db_updateDBbyUplink(dev_eui, data, base_data);

    // Get humidity min and max from db
    let entries = await db_getEntries() || [];
    let hum_min: number = 30; 
    let hum_max: number = 80;
    for (let i = 0; i < entries.length; i++) {
        if(entries[i].dev_eui == dev_eui){
            hum_min = parseInt(entries[i].hum_min);
            hum_max = parseInt(entries[i].hum_max);
        }
    }
    // Check soil humidity and call sendDownlink() if needed
    if (data.soil_humidity != undefined) {
        data.soil_humidity = data.soil_humidity.replace("%", "");
        if (parseInt(data.soil_humidity) <= hum_min) {
            console.log("Downlink: Pump start");
            sendDownlink(0);
        } else if (parseInt(data.soil_humidity) >= hum_max) {
            console.log("Downlink: Pump stop");
            sendDownlink(1);
        } 
    }
});

// Updates the user input fields.
app.post('/update', async (req, res) => {
    let id = req.body.dbid;
    let entrie = {
        description: req.body.description ? req.body.description : "Beschreibung...",
        watering_time: req.body.watering_time ? req.body.watering_time : "8:00",
        hum_min: req.body.hum_min ? req.body.hum_min : 30,
        hum_max: req.body.hum_max ? req.body.hum_max : 80,
        max_distance: req.body.max_distance ? req.body.max_distance : 250,
    };
    // Update db
    await db_updateEditableFields(id, entrie);

    // Reloade page
    res.redirect('back');
});

/* Function for sending downlinks
 0 for relais light on
 1 for relais light off */
function sendDownlink(on_off: 1 | 0) {
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
    }else{
        console.log("ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.");
    }
}

app.listen(8000);
