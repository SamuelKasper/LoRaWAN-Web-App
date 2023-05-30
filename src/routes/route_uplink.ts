import { Request, Response } from "express";
import { Distance_sensor } from "../distance_sensor";
import { Weather } from "../weather";
import { Database } from "../db";
import { any_valve_open, get_sensor_instance } from "../server";

export class Route_uplink {
    // Has to be Strings, because time_control & weather_control are set as checkbox values.
    private time_control = "true";
    private weather_control = "true";
    private weather = new Weather();
    private distance_sensor = new Distance_sensor();
    public static watering_rn: boolean = false;

    /** Processing uplink data. */
    public async process_uplink(req: Request, res: Response, db: Database) {
        // Respond to ttn. Otherwise the uplink will fail.
        res.sendStatus(200);

        // Parse request body into a JSON object.
        let sensor_data = JSON.parse(JSON.stringify(req.body));

        // Only process uplinks with a decoded payload
        if (sensor_data.uplink_message.decoded_payload) {
            let base_data = await this.build_data_object(sensor_data);
            let extended_data = await this.set_db_values(base_data, db);
            await db.update_by_uplink(extended_data.dev_eui, extended_data, base_data);

            // If uplink data comes from soil sensor, check if watering is necessary
            if (extended_data.soil_humidity) {
                // Get instance of class
                let instance = get_sensor_instance(extended_data.dev_eui);
                await instance.check_humidity(extended_data);
                // Check if any valve if open. If not stop watering.
                if (!any_valve_open()) {
                    if (Route_uplink.watering_rn) {
                        await instance.downlink(0, 2);
                        Route_uplink.watering_rn = false;
                    } else {
                        console.log("Route_uplink: Watering already stopped.");
                    }
                }
            }

            // If uplink data comes from distance sensor, check if switching the valve is necessary
            if (extended_data.distance) {
                this.distance_sensor.set_waterlevel(extended_data);
            }
        }
    }

    /** Create an object of type DB_entrie with the sensor data. */
    private async build_data_object(sensor_data: any): Promise<DB_entrie> {

        // Sort rx_metadata by rssi. Best rssi will be in first array entry.
        let sorted_gateways_by_rssi = sensor_data.uplink_message.rx_metadata.sort(
            (data_1: any, data_2: any) => data_2.rssi - data_1.rssi);

        // Get coordinates of gateway and fetch weather API
        let latitude_val = <number>sorted_gateways_by_rssi[0].location.latitude.toFixed(2);
        let longitude_val = <number>sorted_gateways_by_rssi[0].location.longitude.toFixed(2);
        if (latitude_val && longitude_val) {
            await this.weather.fetch_weather(latitude_val, longitude_val);
        }

        // Add all data to their specific fields. Some fields will be undefined.
        let decoded_payload = sensor_data.uplink_message.decoded_payload;
        let data: DB_entrie = {
            // Data other than enviroment data
            name: <string>sensor_data.end_device_ids.device_id,
            gateway: <string>sorted_gateways_by_rssi[0].gateway_ids.gateway_id,
            time: sensor_data.received_at.toLocaleString('de-DE'),
            dev_eui: <string>sensor_data.end_device_ids.dev_eui,
            rssi: <number>sorted_gateways_by_rssi[0].rssi,
            city: this.weather.get_city,
            weather_forecast_3h: this.weather.get_weather,
            description: "Beschreibung...",

            // Soil, sensor sends also °C and %!
            soil_temperature: <string>decoded_payload.temp_SOIL,
            soil_humidity: <string>decoded_payload.water_SOIL,

            // Waterlevel, measured by distance
            distance: <number>decoded_payload.distance,
        };

        // Delete entries with value undefined 
        for (const [key, val] of Object.entries(data)) {
            if (val == undefined) {
                delete data[key as keyof typeof data];
            }
        }

        // Set distance to cm
        if (data.distance) {
            data.distance = data.distance / 10;
        }
        return data;
    }

    /**Replace non sensor data (user inputs) with already existring db values. */
    private async set_db_values(data: DB_entrie, db: Database): Promise<DB_entrie> {
        // Default values
        let default_min = 30;
        let default_max = 75;
        let default_max_distance = 200;
        let default_time = "08:00";
        let default_relais: 1 | 2 = 1;

        let db_entrie = await db.get_entrie_by_id(data.dev_eui);
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
        } else {
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
    }
}