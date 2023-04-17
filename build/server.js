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
app.use(express_1.default.static("views"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.set("view engine", "ejs");
dotenv.config();
// Show db entries on load
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let entries = (yield (0, db_1.getEntries)()) || [];
    for (let i = 0; i < entries.length; i++) {
        // calculate percentage for distance
        if (entries[i].distance != "undefined") {
            let max = entries[i].max_distance * 10;
            let dist = entries[i].distance;
            let percent = entries[i].distance / max * 100;
            console.log(dist, max);
            let percent_str = percent.toFixed(1);
            entries[i].distance = percent_str + "% (" + dist / 10 + "cm)";
            if (percent < 10) {
                entries[i].distance += " | Achtung, das Wasser ist fast aufgebraucht!";
            }
        }
    }
    // test end
    res.render("index", { entries });
}));
// recieves uplink from webhook
// to test this with postman, place .data after jsonObj. Must be removed bedore uploading to render!
app.post('/uplink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // respond to ttn. Otherwise the uplink will fail.
    res.sendStatus(200);
    // parse request body into a jsonObj.
    let jsonObj = JSON.parse(JSON.stringify(req.body));
    // use dev_eui as identifier to get the mongodb id later
    let dev_eui = jsonObj.end_device_ids.dev_eui;
    let data = {
        name: jsonObj.end_device_ids.device_id,
        gateway: jsonObj.uplink_message.rx_metadata[0].gateway_ids.gateway_id,
        //air
        air_temperature: jsonObj.uplink_message.decoded_payload.TempC_SHT,
        air_humidity: jsonObj.uplink_message.decoded_payload.Hum_SHT,
        //soil
        soil_temperature: jsonObj.uplink_message.decoded_payload.temp_SOIL,
        soil_humidity: jsonObj.uplink_message.decoded_payload.water_SOIL,
        //waterlevel
        distance: jsonObj.uplink_message.decoded_payload.distance,
        //
        time: jsonObj.received_at.toLocaleString('de-DE'),
        dev_eui: jsonObj.end_device_ids.dev_eui,
        rssi: jsonObj.uplink_message.rx_metadata[0].rssi,
        //init values.
        //fields that can be changed by the user. Only applied at first appearance in db. Later changed by /update.
        description: "Beschreibung...",
        hum_min: 30,
        hum_max: 80,
        watering_time: "08:00",
        max_distance: 0
    };
    //update db
    yield (0, db_1.updateDBbyUplink)(dev_eui, data);
    // Get humidity min and max from db
    let entries = (yield (0, db_1.getEntries)()) || [];
    let hum_min = 30, hum_max = 80;
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].dev_eui == dev_eui) {
            hum_min = parseInt(entries[i].hum_min);
            hum_max = parseInt(entries[i].hum_max);
        }
    }
    // Check soil humidity and call sendDownlink() if needed
    if (data.soil_humidity != undefined) {
        data.soil_humidity = data.soil_humidity.replace("%", "");
        if (parseInt(data.soil_humidity) <= hum_min) {
            console.log("downlink: water start");
            sendDownlink(0);
        }
        else if (parseInt(data.soil_humidity) >= hum_max) {
            console.log("downlink: water stop");
            sendDownlink(1);
        }
    }
}));
// updates the user input fields.
app.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let id = req.body.dbid;
    let entrie = {
        description: req.body.description || "undefined",
        watering_amount: req.body.watering_amount || "undefined",
        hum_min: req.body.hum_min || "undefined",
        hum_max: req.body.hum_max || "undefined",
        max_distance: req.body.max_distance || "undefined"
    };
    yield (0, db_1.updateDB)(id, entrie);
    // relode page
    res.redirect('back');
}));
/* function for sending downlinks
 0 for relais light on
 1 for relais light off */
function sendDownlink(on_off) {
    // Only allow downlink while ENABLE_DOWNLINK is set to true
    if (process.env.ENABLE_DOWNLINK == "true") {
        let app1 = "kaspersa-hfu-bachelor-thesis";
        let wh1 = "webapp";
        let dev1 = "eui-70b3d57ed005c853";
        //prepare payload
        let data = JSON.stringify({
            "downlinks": [{
                    "decoded_payload": {
                        "on_off": on_off
                    },
                    "f_port": 15,
                    "priority": "NORMAL"
                }]
        });
        // preparing post options
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
        let req = https_1.default.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            /*console.log(`Headers: ${JSON.stringify(res.headers)}`);
            res.setEncoding("utf-8");
            res.on("data",(chunk) =>{
                console.log(`body: ${chunk}`);
            });*/
        });
        req.on("error", (e) => {
            console.log(`Error: ${e.message}`);
        });
        // write data to stream and close connection after
        req.write(data);
        req.end();
    }
    else {
        console.log("ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.");
    }
}
app.listen(8000);
