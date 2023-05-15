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
const weather_1 = require("./weather");
class Routes {
    constructor() {
        this.time_control = "true";
        this.percent_to_switch = 10;
        this.downlink = new downlink_1.Downlink();
        this.db = new db_1.DB();
        this.weather = new weather_1.Weather();
    }
    /** Loading data from DB and displays it on default URL. */
    default(res) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = (yield this.db.get_entries()) || [];
            for (let i = 0; i < entries.length; i++) {
                // Calculate percentage for distance
                if (entries[i].distance) {
                    let max = entries[i].max_distance;
                    let dist = entries[i].distance;
                    let percent = 100 - (dist / max * 100);
                    let percent_str = percent.toFixed(1);
                    entries[i].distance = `${percent_str} % (${(max - dist)} cm)`;
                    // Add message if zistern water level is below 10%
                    if (percent < this.percent_to_switch) {
                        entries[i].alert = "warning";
                    }
                }
                // Add text for RSSI
                switch (true) {
                    case entries[i].rssi > -100:
                        entries[i].rssi = "Sehr gut";
                        break;
                    case entries[i].rssi > -105:
                        entries[i].rssi = "Gut";
                        break;
                    case entries[i].rssi > -115:
                        entries[i].rssi = "Ausreichend";
                        break;
                    case entries[i].rssi < -120:
                        entries[i].rssi = "Schlecht";
                        break;
                }
                // Add parameter to check watering status
                if (entries[i].soil_humidity) {
                    if (this.downlink.get_last_soil_downlink == 0) {
                        entries[i].last_soil_downlink = "Bewässerung ist aktiv";
                    }
                    else {
                        entries[i].last_soil_downlink = "Bewässerung ist inaktiv";
                    }
                }
            }
            // Render the page with given entries
            res.render("index", { entries });
        });
    }
    /** Processing uplink data. */
    uplink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Respond to ttn. Otherwise the uplink will fail.
            res.sendStatus(200);
            // Parse request body into a JSON object.
            let sensor_data = JSON.parse(JSON.stringify(req.body));
            // Only process uplinks with a decoded payload
            if (sensor_data.uplink_message.decoded_payload) {
                let base_data = this.build_data_object(sensor_data);
                let extended_data = yield this.replace_with_db_values(base_data);
                yield this.db.update_db_by_uplink(extended_data.dev_eui, extended_data, base_data);
                // If uplink data comes from soil sensor, check if watering is necessary
                if (extended_data.soil_humidity) {
                    this.downlink.check_soil(extended_data);
                }
                // If uplink data comes from distance sensor, check if switching the valve is necessary
                if (extended_data.distance) {
                    this.downlink.check_waterlevel(extended_data, this.percent_to_switch);
                }
            }
        });
    }
    /** Create an object of type DB_entrie with the sensor data. */
    build_data_object(sensor_data) {
        // Sort rx_metadata by rssi. Best rssi will be in first array entry.
        let sorted_gateways_by_rssi = sensor_data.uplink_message.rx_metadata.sort((data_1, data_2) => data_2.rssi - data_1.rssi);
        // Get coords of gateway
        let latitude_val = sorted_gateways_by_rssi[0].location.latitude.toFixed(2);
        let longitude_val = sorted_gateways_by_rssi[0].location.longitude.toFixed(2);
        // Fetch weather API
        if (process.env.FETCH_WEATHER == "true") {
            if (latitude_val && longitude_val) {
                this.weather.fetch_weather(latitude_val, longitude_val);
            }
        }
        else {
            console.log("FETCH_WEATHER is disabled");
        }
        // Add all data to their specific fields. Some fields will be undefined.
        let decoded_payload = sensor_data.uplink_message.decoded_payload;
        let data = {
            // Data other than enviroment data
            name: sensor_data.end_device_ids.device_id,
            gateway: sorted_gateways_by_rssi[0].gateway_ids.gateway_id,
            time: sensor_data.received_at.toLocaleString('de-DE'),
            dev_eui: sensor_data.end_device_ids.dev_eui,
            rssi: sorted_gateways_by_rssi[0].rssi,
            // Coords of gateways
            latitude: latitude_val,
            longitude: longitude_val,
            city: this.weather.get_city,
            weather_forecast_3h: this.weather.get_weather,
            description: "Beschreibung...",
            // Air, just sends the Data without °C and %
            air_temperature: decoded_payload.TempC_SHT,
            air_humidity: decoded_payload.Hum_SHT,
            // Soil, sensor sends also °C and %!
            soil_temperature: decoded_payload.temp_SOIL,
            soil_humidity: decoded_payload.water_SOIL,
            // Waterlevel, measured by distance
            distance: decoded_payload.distance,
        };
        // Delete entries with value undefined 
        for (const [key, val] of Object.entries(data)) {
            if (val == undefined) {
                delete data[key];
            }
        }
        // Set distance to cm
        if (data.distance) {
            data.distance = data.distance / 10;
        }
        return data;
    }
    /**Replace non sensor data (user inputs) with already existring db values. */
    replace_with_db_values(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Default values
            let default_min = 30;
            let default_max = 75;
            let default_max_distance = 200;
            let default_time = "08:00";
            let entries = (yield this.db.get_entries()) || [];
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].dev_eui == data.dev_eui) {
                    // Overwrite description
                    data.description = entries[i].desription;
                    // Add editable fields for soil if data is from soil sensor
                    if (data.soil_humidity) {
                        data.hum_min = entries[i].hum_min ? entries[i].hum_min : default_min;
                        data.hum_max = entries[i].hum_max ? entries[i].hum_max : default_max;
                        data.watering_time = entries[i].watering_time ? entries[i].watering_time : default_time;
                        data.time_control = entries[i].time_control ? entries[i].time_control : this.time_control;
                    }
                    // Add editable fields for distance if data is from distance sensor
                    if (data.distance) {
                        data.max_distance = entries[i].max_distance ? entries[i].max_distance : default_max_distance;
                    }
                }
            }
            return data;
        });
    }
    /** Processing data from user input fields send by form submit. */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let entrie = {};
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
            yield this.db.update_editable_fields(req.body.dbid, entrie);
            // Reloade page
            res.redirect('back');
        });
    }
    /** Calling direct downlink from class Downlink. */
    direct_downlink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            this.downlink.direct_downlink();
            // Reloade page
            res.redirect('back');
        });
    }
}
exports.Routes = Routes;
