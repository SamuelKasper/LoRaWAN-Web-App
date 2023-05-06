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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downlink = void 0;
const https_1 = __importDefault(require("https"));
class Downlink {
    constructor() {
        this.waiting = false;
        this.last_time = "08:00";
        this.last_soil_downlink = 1;
    }
    // Checking if humidity is below or above the border values
    prepare_downlink(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if required data is available
            if (data.soil_humidity != undefined && data.watering_time != undefined
                && data.hum_min != undefined && data.hum_max != undefined) {
                // Check soil humidity and call sendDownlink() if needed
                const humidity = parseInt(data.soil_humidity.replace("%", ""));
                if (humidity <= data.hum_min) {
                    this.humidity_less_than_bordervalue(data);
                }
                else if (humidity >= data.hum_max) {
                    this.humidity_greater_than_bordervalue();
                }
                // Set new value for the last watering time
                this.last_time = data.watering_time;
            }
        });
    }
    // Checking if time control is enabled or disabled
    humidity_less_than_bordervalue(data) {
        if (data.time_control != undefined) {
            if (data.time_control.toString() == "true") {
                this.time_control_enabled(data);
            }
            else {
                this.time_control_disabled(data);
            }
        }
    }
    // Schedule downlink
    time_control_enabled(data) {
        // Check if watering time has changed
        if (this.last_time == data.watering_time) {
            // Check if downlink is already scheduled
            if (!this.waiting) {
                this.schedule_downlink(data);
            }
            else {
                console.log(`Downlink already scheduled for ${data.watering_time}`);
            }
        }
        else {
            // Delete former timeout
            clearTimeout(this.timeoutID);
            // Schedule downlink
            this.schedule_downlink(data);
        }
    }
    // Sending downlink to start watering
    time_control_disabled(data) {
        console.log(`Time control is set to: ${data.time_control}`);
        if (this.last_soil_downlink != 0) {
            // Delete former timeout if existing
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
            }
            // Schedule downlink
            this.send_downlink(0);
        }
    }
    // Called if humidity is greater then the upper border value
    humidity_greater_than_bordervalue() {
        if (this.last_soil_downlink != 1) {
            this.send_downlink(1); // Turns the relais off
            console.log(`Downlink to stop watering`);
        }
        else {
            console.log(`Downlink to stop watering has been already sent or watering has already been stopped`);
        }
    }
    // Scheduling a downlink
    schedule_downlink(data) {
        // Get waiting time
        if (data.watering_time) {
            const waiting_time = this.calculate_waiting_time(data.watering_time);
            // Wait a specific time before running sendDownlink
            this.timeoutID = setTimeout(() => {
                this.send_downlink(0); // Turns the relais on
            }, waiting_time);
            // Set waiting indicator to true
            this.waiting = true;
            console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`);
        }
    }
    /* Function for sending downlinks
     0 for relais on | 1 for relais off */
    send_downlink(on_off) {
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
            let req = https_1.default.request(options, (res) => {
                console.log(`Status: ${res.statusCode}`);
            });
            req.on("error", (e) => {
                console.log(`Error: ${e.message}`);
            });
            // Write data to stream and close connection after
            req.write(data);
            req.end();
        }
        else {
            console.log(`ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.`);
        }
        // Reset waiting, so a new downlink can be scheduled
        console.log(`Waiting => false`);
        this.waiting = false;
        this.last_soil_downlink = on_off;
    }
    // Returns the value of the last downlink
    get get_last_soil_downlink() {
        return this.last_soil_downlink;
    }
    // Calculate waiting time
    calculate_waiting_time(_watering_time) {
        // Split input into hours and minutes
        let splitted_time = _watering_time.split(":");
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
        let time_left = 0;
        let ms_per_day = 86400000;
        if (watering_time_millisecs > now_millisecs) {
            time_left = watering_time_millisecs - now_millisecs;
        }
        else {
            time_left = watering_time_millisecs - now_millisecs;
            time_left = ms_per_day + time_left;
        }
        return time_left;
    }
    // Sending downlink with either 0 or 1
    direct_downlink() {
        if (this.last_soil_downlink == 0) {
            this.send_downlink(1);
        }
        else if (this.last_soil_downlink == 1) {
            this.send_downlink(0);
        }
    }
}
exports.Downlink = Downlink;
