import { Response, Request } from "express";
import { DB } from "./db";
import { Downlink } from "./downlink";

export class Routes {
    private default_min = 30;
    private default_max = 75;
    private default_max_distance = 200;
    private default_time = "08:00";
    private downlink = new Downlink();
    private db = new DB();

    // Loading data from DB and displays it on default URL
    public async default(res: Response) {
        let entries = await this.db.getEntries() || [];

        for (let i = 0; i < entries.length; i++) {
            // Calculate percentage for distance
            if (entries[i].distance) {
                let max: number = entries[i].max_distance * 10;
                let dist: number = entries[i].distance;
                let percent: number = 100 - (dist / max * 100);
                let percent_str: string = percent.toFixed(1);
                entries[i].distance = `${percent_str} % (${(max - dist) / 10} cm)`;
                // Add message if zistern water level is below 10%
                if (percent < 10) {
                    entries[i].alert = "warning";
                }
            }
        }
        // Render the page with given entries
        res.render("index", { entries });
    }

    // Receives the uplink data and processes it
    public async uplink(req: Request, res: Response) {
        // Respond to ttn. Otherwise the uplink will fail.
        res.sendStatus(200);

        // Parse request body into a jsonObj.
        let jsonObj = JSON.parse(JSON.stringify(req.body));

        // Search for best RSSI 
        let sorted_gateways_by_rssi = jsonObj.uplink_message.rx_metadata.sort(
            (data_1: any, data_2: any) => data_2.rssi - data_1.rssi);

        // Only process uplinks with a decoded payload
        if (jsonObj.uplink_message.decoded_payload) {
            // Add all data to their specific fields. Some fields will be undefined.
            let sensorData = jsonObj.uplink_message.decoded_payload;
            let data: DB_entrie = {
                // Data other than enviroment data
                name: <string>jsonObj.end_device_ids.device_id,
                gateway: <string>sorted_gateways_by_rssi[0].gateway_ids.gateway_id,
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
            let entries = await this.db.getEntries() || [];
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].dev_eui == data.dev_eui) {
                    // Add editable fields for soil if data is from soil sensor
                    if (data.soil_humidity) {
                        data.hum_min = entries[i].hum_min ? entries[i].hum_min : this.default_min;
                        data.hum_max = entries[i].hum_max ? entries[i].hum_max : this.default_max;
                        data.watering_time = entries[i].watering_time ? entries[i].watering_time : this.default_time;
                    }
                    // Add editable fields for distance if data is from distance sensor
                    if (data.distance) {
                        data.max_distance = entries[i].max_distance ? entries[i].max_distance : this.default_max_distance;
                    }
                }
            }

            // Update db 
            await this.db.updateDBbyUplink(data.dev_eui, data, base_data);

            // Check for necessary downlink if the sensor ist a soil sensor
            if (data.soil_humidity) {
                //checkDownlink(data);
                this.downlink.prepareDownlink(data);
            }
        }
    }

    // Receives and updates the user input fields
    public async update(req: Request, res: Response) {
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
        await this.db.updateEditableFields(req.body.dbid, entrie);

        // Reloade page
        res.redirect('back');
    }
}