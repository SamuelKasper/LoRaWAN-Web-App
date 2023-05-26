const fetch = require("node-fetch");
import { Distance_sensor } from "./distance_sensor";

export class Soil_sensor {
    private waiting_for_timer: boolean = false;
    private timeout_id?: NodeJS.Timeout;
    private last_watering_time: string = "08:00";
    private last_soil_downlink: number = 2;
    private min_waterlevel: number = 10;
    private valve_1: boolean = false;
    private valve_2: boolean = false;

    /** Checking if humidity is below or above the border values. */
    public async check_humidity(data: DB_entrie) {
        // Check if required data is available
        if (data.soil_humidity == undefined || data.watering_time == undefined || data.hum_min == undefined || data.hum_max == undefined) {
            return;
        }

        if (data.weather_control == "true") {
            // Check if its raining. True = raining, no need for watering.
            if (this.check_for_rain(data)) {
                return;
            }
        }

        // Check humidity
        const humidity = parseInt(data.soil_humidity.replace("%", ""));
        if (humidity <= data.hum_min) {
            this.start_watering(data);
        } else {
            if (data.relais_nr) {
                this.prepare_downlink(data.relais_nr);
            }
        }

        // Set new value for the last watering time
        this.last_watering_time = data.watering_time;
    }

    /** Checking if time control is enabled or disabled. */
    private start_watering(data: DB_entrie) {
        if (data.time_control == undefined) {
            return;
        }

        if (data.time_control.toString() == "true") {
            this.watering_by_time(data);
        } else {
            this.watering_by_boardervalue(data);
        }
    }

    /** Check if downlink is already scheduled for specific time. */
    private watering_by_time(data: DB_entrie) {
        // Check if watering time has changed
        if (this.last_watering_time == data.watering_time) {
            // Check if downlink is already scheduled
            if (!this.waiting_for_timer) {
                this.schedule_downlink(data);
            } else {
                console.log(`Downlink already scheduled for ${data.watering_time}`);
            }
        } else {
            // Delete former timeout
            clearTimeout(this.timeout_id);
            // Schedule downlink
            this.schedule_downlink(data);
        }
    }

    /** Sending downlink to start watering by boardervalues. */
    private async watering_by_boardervalue(data: DB_entrie) {
        console.log(`Time control is turned off.`);

        // If watering is inactive
        if (this.last_soil_downlink == 2) {
            // Delete former timeout if existing
            if (this.timeout_id) {
                clearTimeout(this.timeout_id);
            }
            if (data.relais_nr != undefined) {
                await this.prepare_downlink(data.relais_nr);
            } else { console.log("relais nr is: ", data.relais_nr); }
        } else {
            console.log(`Watering is already active.`);
        }
    }

    /** Scheduling a downlink for specific time. */
    private async schedule_downlink(data: DB_entrie) {
        // Get waiting time
        if (data.watering_time) {
            const waiting_time = this.calculate_waiting_time(data.watering_time);
            // Wait a specific time before running sendDownlink
            this.timeout_id = setTimeout(async () => {
                if (data.relais_nr != undefined) {
                    await this.prepare_downlink(data.relais_nr);
                } else { console.log("relais nr is: ", data.relais_nr); }
            }, waiting_time);
            // Set waiting indicator to true
            this.waiting_for_timer = true;
            console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`)
        }
    }

    /** Preparing payload and sending downlinks for opening / closing valves and start / stop the watering. */
    public async prepare_downlink(valve: 1 | 2) {
        // Open the valve, given as parameter. 1 = relais 3, 2 = relais 4
        let payload;
        if (valve == 1) {
            payload = 3;
        } else {
            payload = 4;
        }

        // Open or close the valve
        await this.downlink(payload);

        // Set values to check if valve is open or closed
        if (valve == 1) {
            if (this.valve_1) {
                this.valve_1 = false;
            } else {
                this.valve_1 = true;
            }
        } else {
            if (this.valve_2) {
                this.valve_2 = false;
            } else {
                this.valve_2 = true;
            }
        }

        console.log("valve_1: ", this.valve_1);
        console.log("valve_2: ", this.valve_2);

        // Call downlink to start watering if at least one valve is open
        if (this.valve_1 || this.valve_2) {
            let waterlevel = Distance_sensor.getInstance.get_waterlevel;
            if (waterlevel <= this.min_waterlevel) {
                if (waterlevel == -1) {
                    console.log(`Waterlevel not measured yet! Wait for distance sensor to send data.`);
                } else {
                    console.log(`Waterlevel below 10% (${waterlevel}).`);
                }
                console.log(`Using valve for watering!`);
                // Not enough water in zistern
                await this.downlink(1);
                this.last_soil_downlink = 1;
            } else {
                // Enough water in zistern
                await this.downlink(0);
                this.last_soil_downlink = 0;
            }
            // update controlling variables
            this.waiting_for_timer = false;
            console.log(`Waiting => false; last_soil_downlink = ${this.get_last_soil_downlink}`);
        }

        // Call downlink to stop watering
        if (!this.valve_1 && !this.valve_2) {
            this.downlink(2);
            this.last_soil_downlink = 2;
        }
    }

    /** Sending downlink with given payload */
    private async downlink(payload: number) {
        let app1 = "kaspersa-hfu-bachelor-thesis";
        let wh1 = "webapp";
        let dev1 = "eui-70b3d57ed005c853";
        let url = `https://eu1.cloud.thethings.network/api/v3/as/applications/${app1}/webhooks/${wh1}/devices/${dev1}/down/push`
        // Prepare payload data
        let data = JSON.stringify({
            "downlinks": [{
                "decoded_payload": {
                    "on_off": payload
                },
                "f_port": 15,
                "priority": "NORMAL"
            }]
        });
        await fetch(url, {
            method: "POST",
            body: data,
            headers: {
                "Authorization": `${process.env.AUTH_TOKEN}`,
                "Content-type": "application/json;",
                "User-Agent": "webapp/1.0",
                "Connection": "keep-alive",
                "Content-Length": Buffer.byteLength(data).toString(),
                "accept": "*/*",

            },
        })
            .then((resp: any) => {
                console.log(`TTN Downlink Response: ${resp.statusText}`);
            })
            .catch(console.error);
    }

    /** Returns the value of the last downlink. */
    public get get_last_soil_downlink(): number {
        return this.last_soil_downlink;
    }

    /** Calculate waiting time. */
    private calculate_waiting_time(_watering_time: string): number {
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

    /** Check if rain amount is above 0.5mm. */
    private check_for_rain(extended_data: DB_entrie): boolean {
        let rain_amount_arr = extended_data.weather_forecast_3h.split(":");
        let rain_amount = parseFloat(rain_amount_arr[1].replace("mm", ""));
        if (rain_amount > 0.5) {
            console.log("Expecting rain. Don't check if watering is needed.");
            return true;
        }
        console.log("Rain amount below 0.5mm. Check if watering is needed.");
        return false;
    }
}