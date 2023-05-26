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
exports.Route_uplink = void 0;
const distance_sensor_1 = require("../distance_sensor");
const weather_1 = require("../weather");
const server_1 = require("../server");
class Route_uplink {
    constructor() {
        this.time_control = "true";
        this.weather_control = "true";
        this.weather = new weather_1.Weather();
        this.distance_sensor = new distance_sensor_1.Distance_sensor();
    }
    /** Processing uplink data. */
    process_uplink(req, res, db) {
        return __awaiter(this, void 0, void 0, function* () {
            // Respond to ttn. Otherwise the uplink will fail.
            res.sendStatus(200);
            // Parse request body into a JSON object.
            let sensor_data = JSON.parse(JSON.stringify(req.body));
            // Only process uplinks with a decoded payload
            if (sensor_data.uplink_message.decoded_payload) {
                let base_data = yield this.build_data_object(sensor_data);
                let extended_data = yield this.set_db_values(base_data, db);
                yield db.update_by_uplink(extended_data.dev_eui, extended_data, base_data);
                // If uplink data comes from soil sensor, check if watering is necessary
                if (extended_data.soil_humidity) {
                    // Get instance of class
                    let instance = (0, server_1.get_sensor_instance)(extended_data.dev_eui);
                    instance.check_humidity(extended_data);
                    // Check if any valve if open. If not stop watering.
                    if (!(0, server_1.any_valve_open)()) {
                        if (Route_uplink.watering_rn) {
                            instance.downlink(0, 2);
                            Route_uplink.watering_rn = false;
                        }
                        else {
                            console.log("Route_uplink: Watering already stopped.");
                        }
                    }
                }
                // If uplink data comes from distance sensor, check if switching the valve is necessary
                if (extended_data.distance) {
                    this.distance_sensor.set_waterlevel(extended_data);
                }
            }
        });
    }
    /** Create an object of type DB_entrie with the sensor data. */
    build_data_object(sensor_data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sort rx_metadata by rssi. Best rssi will be in first array entry.
            let sorted_gateways_by_rssi = sensor_data.uplink_message.rx_metadata.sort((data_1, data_2) => data_2.rssi - data_1.rssi);
            // Get coordinates of gateway and fetch weather API
            let latitude_val = sorted_gateways_by_rssi[0].location.latitude.toFixed(2);
            let longitude_val = sorted_gateways_by_rssi[0].location.longitude.toFixed(2);
            if (latitude_val && longitude_val) {
                yield this.weather.fetch_weather(latitude_val, longitude_val);
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
                city: this.weather.get_city,
                weather_forecast_3h: this.weather.get_weather,
                description: "Beschreibung...",
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
        });
    }
    /**Replace non sensor data (user inputs) with already existring db values. */
    set_db_values(data, db) {
        return __awaiter(this, void 0, void 0, function* () {
            // Default values
            let default_min = 30;
            let default_max = 75;
            let default_max_distance = 200;
            let default_time = "08:00";
            let default_relais = 1;
            let db_entrie = yield db.get_entrie_by_id(data.dev_eui);
            // If data is already in db
            if (db_entrie != null && db_entrie != undefined) {
                // Overwrite description
                data.description = db_entrie.desription;
                // Add editable fields for soil if data is from soil sensor
                if (data.soil_humidity) {
                    data.hum_min = db_entrie.hum_min;
                    data.hum_max = db_entrie.hum_max;
                    data.watering_time = db_entrie.watering_time;
                    data.time_control = db_entrie.time_control;
                    data.weather_control = db_entrie.weather_control;
                    data.relais_nr = db_entrie.relais_nr;
                }
                // Add editable fields for distance if data is from distance sensor
                if (data.distance) {
                    data.max_distance = db_entrie.max_distance;
                }
                // If there is no data in db
            }
            else {
                // Set description
                data.description = "Beschreibung";
                // Add editable fields for soil if data is from soil sensor
                if (data.soil_humidity) {
                    data.hum_min = default_min;
                    data.hum_max = default_max;
                    data.watering_time = default_time;
                    data.time_control = this.time_control;
                    data.weather_control = this.weather_control;
                    data.relais_nr = default_relais;
                }
                // Add editable fields for distance if data is from distance sensor
                if (data.distance) {
                    data.max_distance = default_max_distance;
                }
            }
            return data;
        });
    }
}
Route_uplink.watering_rn = false;
exports.Route_uplink = Route_uplink;
