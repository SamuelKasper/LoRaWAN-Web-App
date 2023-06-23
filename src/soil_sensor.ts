const fetch = require("node-fetch");
import { Route_uplink } from "./routes/route_uplink";

export class Soil_sensor {
    private waiting_for_timer: boolean = false;
    private timeout_id?: NodeJS.Timeout;
    private last_watering_time: string = "08:00";
    public valve_open: boolean = false;
    public active_watersource: number = 0;

    /** Checking if humidity is below or above the border values. */
    public async check_humidity(data: DB_entrie) {
        // Check if required data is available
        if (data.soil_humidity == undefined || data.watering_time == undefined ||
            data.hum_min == undefined || data.hum_max == undefined) {
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
            this.check_time_control(data);
        } else if (humidity > data.hum_max) {
            // Stop watering if not already done
            if (this.valve_open == true) {
                console.log("Sending downlink to close valve.")
                if (data.relais_nr) {
                    await this.prepare_payload(data.relais_nr);
                }
            } else { console.log("Soil_sensor: Valve already closed.") }
        }

        // Set new value for the last watering time
        this.last_watering_time = data.watering_time;
    }

    /** Checking if time control is enabled or disabled. */
    private check_time_control(data: DB_entrie) {
        if (data.time_control == undefined) {
            return;
        }

        if (data.time_control.toString() == "true") {
            this.check_time_changed(data);
        } else {
            this.watering_by_boardervalue(data);
        }
    }

    /** Check if downlink is already scheduled for specific time. */
    private check_time_changed(data: DB_entrie) {
        if (this.last_watering_time == data.watering_time) {
            // Check if downlink is already scheduled
            if (this.waiting_for_timer) {
                console.log(`Downlink already scheduled for ${data.watering_time}`);
            } else {
                this.schedule_downlink(data);
            }
        } else {
            // Delete old timeout and set a new one
            clearTimeout(this.timeout_id);
            this.schedule_downlink(data);
        }
    }

    /** Sending downlink to start watering by boardervalues. */
    private async watering_by_boardervalue(data: DB_entrie) {
        console.log(`Time control is turned off.`);

        // If watering is inactive
        if (!Route_uplink.watering_rn) {
            // Delete former timeout if existing
            if (this.timeout_id) {
                clearTimeout(this.timeout_id);
            }
            if (data.relais_nr != undefined) {
                await this.prepare_payload(data.relais_nr);
            } else { console.log("relais nr is: ", data.relais_nr); }
        } else {
            console.log(`Watering is already active.`);
        }
    }

    /** Scheduling a downlink for specific time. */
    private async schedule_downlink(data: DB_entrie) {
        if (data.watering_time) {
            const waiting_time = this.calculate_waiting_time(data.watering_time);

            // Wait a specific time before running prepare_payload
            this.timeout_id = setTimeout(async () => {
                if (data.relais_nr != undefined) {
                    await this.prepare_payload(data.relais_nr);
                } else { console.log("Soil_Sensor: Relais_nr is undefined"); }
            }, waiting_time);

            // Set waiting indicator to true
            this.waiting_for_timer = true;
            console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`)
        }
    }

    /** Preparing payload and sending downlinks for opening / closing valves and start / stop the watering. */
    public async prepare_payload(payload_valve: number) {
        // Check if downlink is enabled by enviroment variable.
        if (process.env.ENABLE_DOWNLINK == "false") {
            console.log("Downlink disabled by enviroment variable.");
            return;
        }

        // Switch values to open or close valve.
        if (this.valve_open) {
            this.valve_open = false;
        } else {
            this.valve_open = true;
        }

        console.log("valve_open: ", this.valve_open);

        // Set payload_watering by waterlevel
        let payload_watering: number;
        let waterlevel = Route_uplink.waterlevel_percent;
        if (waterlevel <= Route_uplink.min_waterlevel) {
            if (waterlevel == -1) {
                console.log("Waterlevel not measured yet! Wait for distance sensor to send data.");
            } else {
                console.log(`Waterlevel below 10% (${waterlevel}).`);
            }
            console.log("Using groundwater / valve for watering!");
            payload_watering = 2;
        } else {
            console.log("Using pump for watering!");
            payload_watering = 1;
        }

        await this.downlink(payload_valve, payload_watering);

        // Update controlling variables
        Route_uplink.watering_rn = true;
        this.waiting_for_timer = false;
        console.log("Waiting => false; watering_rn = true");
    }

    /** Sending downlink with given payload */
    public async downlink(payload_valve: number, payload_watering: number) {
        // Check if downlink is enabled. Needed because downlink will in special cases be called directly
        if (process.env.ENABLE_DOWNLINK == "false") {
            console.log("Downlink disabled by enviroment variable.");
            return;
        }

        let app1 = "kaspersa-hfu-bachelor-thesis";
        let wh1 = "webapp";
        let dev1 = "eui-70b3d57ed005c853";
        let url = `https://eu1.cloud.thethings.network/api/v3/as/applications/${app1}/webhooks/${wh1}/devices/${dev1}/down/push`
        // Prepare payload data
        let data = JSON.stringify({
            "downlinks": [{
                "decoded_payload": {
                    "watersource": payload_watering,
                    "valve": payload_valve
                },
                "f_port": 15,
                "priority": "NORMAL"
            }]
        });
        // Fetch URL with given options
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

        // Set last watersource
        this.active_watersource = payload_watering;
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