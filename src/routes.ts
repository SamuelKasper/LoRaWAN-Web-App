import { Response, Request } from "express";
import { DB } from "./db";
import { Downlink } from "./downlink";
import { Weather } from "./weather";

export class Routes {
    private time_control = "true";
    private percent_to_switch = 10;
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
                if (percent < this.percent_to_switch) {
                    entries[i].alert = "warning";
                }
            }

            // Add text for RSSI
            switch (true) {
                case entries[i].rssi > -100:
                    entries[i].rssi += " | Signalstärke: sehr gut";
                    break;
                case entries[i].rssi > -105:
                    entries[i].rssi += " | Signalstärke: gut";
                    break;
                case entries[i].rssi > -115:
                    entries[i].rssi += " | Signalstärke: ausreichend";
                    break;
                case entries[i].rssi < -120:
                    entries[i].rssi += " | Signalstärke: schlecht";
                    break;
            }

            // Add parameter to check watering status
            if (entries[i].soil_humidity) {
                if (this.downlink.get_last_soil_downlink == 0) {
                    entries[i].last_soil_downlink = "Bewässerung ist aktiv";
                } else {
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
            let base_data = this.build_data_object(sensor_data);
            let extended_data = await this.replace_with_db_values(base_data);
            await this.db.update_db_by_uplink(extended_data.dev_eui, extended_data, base_data);

            // If uplink data comes from soil sensor, check if watering is necessary
            if (extended_data.soil_humidity) {
                this.downlink.check_soil(extended_data);
            }

            // If uplink data comes from distance sensor, check if switching the valve is necessary
            if (extended_data.distance) {
                this.downlink.check_waterlevel(extended_data, this.percent_to_switch);
            }

            // Fetch weather API
            if (process.env.FETCH_WEATHER == "true") {
                if (extended_data.latitude && extended_data.longitude) {
                    this.weather.fetch_weather(extended_data.latitude, extended_data.longitude);
                }
            } else {
                console.log("FETCH_WEATHER is disabled");
            }
        }
    }

    /** Create an object of type DB_entrie with the sensor data. */
    private build_data_object(sensor_data: any): DB_entrie {
        // Sort rx_metadata by rssi. Best rssi will be in first array entry.
        let sorted_gateways_by_rssi = sensor_data.uplink_message.rx_metadata.sort(
            (data_1: any, data_2: any) => data_2.rssi - data_1.rssi);

        // Add all data to their specific fields. Some fields will be undefined.
        let decoded_payload = sensor_data.uplink_message.decoded_payload;
        let data: DB_entrie = {
            // Data other than enviroment data
            name: <string>sensor_data.end_device_ids.device_id,
            gateway: <string>sorted_gateways_by_rssi[0].gateway_ids.gateway_id,
            time: sensor_data.received_at.toLocaleString('de-DE'),
            dev_eui: <string>sensor_data.end_device_ids.dev_eui,
            rssi: <number>sensor_data.uplink_message.rx_metadata[0].rssi,
            // Coords of gateways
            latitude: <number>sensor_data.uplink_message.rx_metadata[0].location.latitude.toFixed(2),
            longitude: <number>sensor_data.uplink_message.rx_metadata[0].location.longitude.toFixed(2),
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

        let entries = await this.db.get_entries() || [];
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
