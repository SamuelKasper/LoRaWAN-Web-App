import { Response, Request } from "express";
import { DB } from "./db";
import { Downlink } from "./downlink";
import { Weather } from "./weather";

export class Routes {
    private time_control = "true";
    private downlink = new Downlink();
    private db = new DB();
    private weather = new Weather();

    /** Loading data from DB and displays it on default URL. */
    public async default(res: Response) {
        let entries = await this.db.get_entries() || [];

        for (let i = 0; i < entries.length; i++) {
            // Calculate percentage for distance
            if (entries[i].distance) {
                let max: number = entries[i].max_distance;
                let dist: number = entries[i].distance;
                let percent: number = 100 - (dist / max * 100);
                let percent_str: string = percent.toFixed(1);
                entries[i].distance = `${percent_str} % (${(max - dist)} cm)`;
                // Add message if zistern water level is below 10%
                if (percent < 10) {
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
                case entries[i].rssi <= -115:
                    entries[i].rssi = "Schlecht";
                    break;
            }

            // Add parameter to check watering status
            if (entries[i].soil_humidity) {
                if (this.downlink.get_last_soil_downlink == 0) {
                    entries[i].last_soil_downlink = "Bewässerung ist aktiv (Zisterne)";
                } else if(this.downlink.get_last_soil_downlink == 2) {
                    entries[i].last_soil_downlink = "Bewässerung ist aktiv (Grundwasser)";
                }else{
                    entries[i].last_soil_downlink = "Bewässerung ist inaktiv";
                }
            }
        }
        // Render the page with given entries
        res.render("index", { entries });
    }

    /** Processing uplink data. */
    public async uplink(req: Request, res: Response) {
        // Respond to ttn. Otherwise the uplink will fail.
        res.sendStatus(200);

        // Parse request body into a JSON object.
        let sensor_data = JSON.parse(JSON.stringify(req.body));

        // Only process uplinks with a decoded payload
        if (sensor_data.uplink_message.decoded_payload) {
            let base_data = await this.build_data_object(sensor_data);
            let extended_data = await this.replace_with_db_values(base_data);
            await this.db.update_db_by_uplink(extended_data.dev_eui, extended_data, base_data);

            // If uplink data comes from soil sensor, check if watering is necessary
            if (extended_data.soil_humidity) {
                if(!this.check_for_rain(extended_data)){
                    this.downlink.prepare_downlink(extended_data);
                }
            }

            // If uplink data comes from distance sensor, check if switching the valve is necessary
            if (extended_data.distance) {
                this.downlink.set_waterlevel(extended_data);
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

            // Air, just sends the Data without °C and %
            air_temperature: <number>decoded_payload.TempC_SHT,
            air_humidity: <number>decoded_payload.Hum_SHT,

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
    private async replace_with_db_values(data: DB_entrie): Promise<DB_entrie> {
        // Default values
        let default_min = 30;
        let default_max = 75;
        let default_max_distance = 200;
        let default_time = "08:00";

        let db_entrie = await this.db.get_entrie_by_field(data.dev_eui);
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
            }
            // Add editable fields for distance if data is from distance sensor
            if (data.distance) {
                data.max_distance = default_max_distance;
            }
        }

        return data;
    }

    /** Check if rain amount is above 0.5mm. */
    private check_for_rain(extended_data: DB_entrie) {
        let rain_amount_arr = extended_data.weather_forecast_3h.split(":");
        let rain_amount = parseFloat(rain_amount_arr[1].replace("mm", ""));
        console.log("Rain amount: ",rain_amount);
        if(rain_amount>0.5){
            console.log("Expecting rain. Don't check if watering is needed.");
            return true;
        }
        console.log("Rain amount below 0.5mm. Check if watering is needed.");
        return false;
    }

    /** Processing data from user input fields send by form submit. */
    public async update(req: Request, res: Response) {
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
        await this.db.update_editable_fields(req.body.dbid, entrie);

        // Reloade page
        res.redirect('back');
    }

    /** Calling direct downlink from class Downlink. */
    public async direct_downlink(req: Request, res: Response) {
        this.downlink.direct_downlink();
        // Reloade page
        res.redirect('back');
    }
} 
