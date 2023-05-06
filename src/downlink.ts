import https from "https";

export class Downlink {
    private waiting: boolean = false;
    private timeoutID?: NodeJS.Timeout;
    private last_time = "08:00";
    private running: boolean = false;
    private last_soil_downlink:number = 1;

    // Checking if watering is needed
    public async prepareDownlink(data: DB_entrie) {
        // Check if required data is available
        if (data.soil_humidity != undefined && data.watering_time != undefined
            && data.hum_min != undefined && data.hum_max != undefined && data.time_control != undefined) {

            // Check soil humidity and call sendDownlink() if needed
            const humidity = parseInt(data.soil_humidity.replace("%", ""));
            // Check if humidity is below min-value
            if (humidity <= data.hum_min) {
                // Time control is enabled
                if(data.time_control.toString() == "true"){ 
                // Check if watering time has changed
                if (this.last_time == data.watering_time) {
                    // Check if downlink is already scheduled
                    if (!this.waiting) {
                        this.scheduleDownlink(data);
                    } else { console.log(`Downlink already scheduled for ${data.watering_time}`); }
                } else {
                    // Delete former timeout
                    clearTimeout(this.timeoutID);
                    // Schedule downlink
                    this.scheduleDownlink(data);
                }
                // If time control is disabled
            }else{
                console.log(`Time control is set to: ${data.time_control}`);
                if(!this.running){
                    // Delete former timeout if existing
                    if(this.timeoutID){
                        clearTimeout(this.timeoutID);
                    }
                    // Shedule downlink
                    this.sendDownlink(0);
                    this.running = true;
                }
            }
                //Check if humidity is above max-value
            } else if (humidity >= data.hum_max) {
                if(this.last_soil_downlink!=1){
                    this.sendDownlink(1); // Turns the relais off
                    this.running = false;
                    console.log(`Downlink to stop watering`);
                }else{
                    console.log(`Downlink to stop watering has been already sent or watering has already been stopped`);
                }
            }
            // Set new value for the last watering time
            this.last_time = data.watering_time;
        }
    }

    // Scheduling a downlink
    private scheduleDownlink(data: DB_entrie) {
        // Get waiting time
        if (data.watering_time) {
            const waiting_time = this.calculateWaitingTime(data.watering_time);
            // Wait a specific time before running sendDownlink
            this.timeoutID = setTimeout(() => {
                this.sendDownlink(0); // Turns the relais on
            }, waiting_time);
            // Set waiting indicator to true
            this.waiting = true;
            console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`)
        }
    }

    /* Function for sending downlinks
     0 for relais on
     1 for relais off */
    private sendDownlink(on_off: 1 | 0) {
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
        } else {
            console.log(`ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.`);
        }

        // Reset waiting, so a new downlink can be sheduled
        console.log(`Waiting => false`);
        this.waiting = false;
        this.last_soil_downlink = on_off;
    }

    // Calculate and then wait for specific time
    // Returns in [0] a value for displaying the time left and in [1] the ms left
    private calculateWaitingTime(_watering_time: string) {
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
}