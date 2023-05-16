import https from "https";

export class Downlink {
    private waiting: boolean = false;
    private timeoutID?: NodeJS.Timeout;
    private last_watering_time = "08:00";
    private last_soil_downlink: number = 1;
    private waterlevel_percent: number = 0;
    private min_waterlevel: number = 10;

    /** Checking if humidity is below or above the border values. */
    public async prepare_downlink(data: DB_entrie) {
        // Check if required data is available
        if (data.soil_humidity == undefined || data.watering_time == undefined || data.hum_min == undefined || data.hum_max == undefined) {
            return;
        }

        const humidity = parseInt(data.soil_humidity.replace("%", ""));
        if (humidity <= data.hum_min) {
            this.humidity_less_than_bordervalue(data);
        } else {
            this.humidity_greater_than_bordervalue();
        }

        // Set new value for the last watering time
        this.last_watering_time = data.watering_time;
    }

    /** Checking if time control is enabled or disabled. */
    private humidity_less_than_bordervalue(data: DB_entrie) {
        if (data.time_control == undefined) {
            return;
        }

        if (data.time_control.toString() == "true") {
            this.time_control_enabled(data);
        } else {
            this.time_control_disabled(data);
        }
    }

    /** Schedule downlink. */
    private time_control_enabled(data: DB_entrie) {
        // Check if watering time has changed
        if (this.last_watering_time == data.watering_time) {
            // Check if downlink is already scheduled
            if (!this.waiting) {
                this.schedule_downlink(data);
            } else {
                console.log(`Downlink already scheduled for ${data.watering_time}`);
            }
        } else {
            // Delete former timeout
            clearTimeout(this.timeoutID);
            // Schedule downlink
            this.schedule_downlink(data);
        }
    }

    /** Sending downlink to start watering. */
    private time_control_disabled(data: DB_entrie) {
        console.log(`Time control is set to: ${data.time_control}`);
        if (this.last_soil_downlink != 0) {
            // Delete former timeout if existing
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
            }
            // Schedule downlink
            this.send_downlink(0);
        } else {
            console.log(`Pump is already active.`);
        }
    }

    /** Called if humidity is greater then the upper border value. */
    private humidity_greater_than_bordervalue() {
        if (this.last_soil_downlink != 1) {
            this.send_downlink(1); // Turns the relais off
            console.log(`Downlink to stop watering`);
        } else {
            console.log(`Downlink to stop watering has been already sent or watering has already been stopped`);
        }
    }

    /** Scheduling a downlink. */
    private schedule_downlink(data: DB_entrie) {
        // Get waiting time
        if (data.watering_time) {
            const waiting_time = this.calculate_waiting_time(data.watering_time);
            // Wait a specific time before running sendDownlink
            this.timeoutID = setTimeout(() => {
                this.send_downlink(0); // Turns the relais on
            }, waiting_time);
            // Set waiting indicator to true
            this.waiting = true;
            console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`)
        }
    }

    /** Function for sending downlinks.
     0 for relais on | 1 for relais off. 
     2 for valve on  | 3 for valve off. */
    private send_downlink(on_off: 0 | 1 | 2 | 3) {

        // Check if theres enought water in zistern otherwise open / close valve.
        if (this.waterlevel_percent <= this.min_waterlevel) {
            console.log(`Waterlevel below 10% or not measured yet. Using valve for watering!`);
            switch (on_off) {
                case 0:
                    on_off = 2;
                    break;
                case 1:
                    on_off = 3;
                    break;
            }
        }

        console.log(`Sending Downlink...`);
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

            // Set values for last_downlink
            if (on_off == 0 || on_off == 2) {
                console.log(`Waiting => false`);
                this.waiting = false;
                this.last_soil_downlink = on_off;
            } else {
                this.last_soil_downlink = 1;
            }
        } else {
            console.log(`ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.`);
        }
    }

    /** Returns the value of the last downlink. */
    public get get_last_soil_downlink(): number {
        return this.last_soil_downlink;
    }

    /** Calculate waiting time. */
    private calculate_waiting_time(_watering_time: string) {
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

    /** Sending dircet downlink for pump controll with either 0 or 1. */
    public direct_downlink() {
        if (this.last_soil_downlink == 0 || this.last_soil_downlink == 2) {
            this.send_downlink(1);
        } else if (this.last_soil_downlink == 1) {
            this.send_downlink(0);
        }
    }

    /** Setting value for waterlevel_percent. */
    public set_waterlevel(data: DB_entrie) {
        if (data.max_distance != undefined && data.distance != undefined) {
            this.waterlevel_percent = 100 - (data.distance / data.max_distance * 100);
            console.log("Set waterlevel to: ", this.waterlevel_percent);
        }
    }
}