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
exports.Soil_sensor = void 0;
const https_1 = __importDefault(require("https"));
const distance_sensor_1 = require("./distance_sensor");
class Soil_sensor {
    constructor() {
        this.waiting_for_timer = false;
        this.last_watering_time = "08:00";
        this.last_soil_downlink = 2;
        this.min_waterlevel = 10;
    }
    /** Checking if humidity is below or above the border values. */
    prepare_downlink(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                this.stop_watering();
            }
            // Set new value for the last watering time
            this.last_watering_time = data.watering_time;
        });
    }
    /** Checking if time control is enabled or disabled. */
    start_watering(data) {
        if (data.time_control == undefined) {
            return;
        }
        if (data.time_control.toString() == "true") {
            this.watering_by_time(data);
        }
        else {
            this.watering_by_boardervalue();
        }
    }
    /** Check if downlink is already scheduled for specific time. */
    watering_by_time(data) {
        // Check if watering time has changed
        if (this.last_watering_time == data.watering_time) {
            // Check if downlink is already scheduled
            if (!this.waiting_for_timer) {
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
    /** Sending downlink to start watering by boardervalues. */
    watering_by_boardervalue() {
        console.log(`Time control is turned off.`);
        // If watering is inactive
        if (this.last_soil_downlink == 2) {
            // Delete former timeout if existing
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
            }
            this.send_downlink(0);
        }
        else {
            console.log(`Watering is already active.`);
        }
    }
    /** Sending downlink to stop watering if not already done. */
    stop_watering() {
        if (this.last_soil_downlink != 2) {
            this.send_downlink(2);
            console.log(`Downlink to stop watering`);
        }
        else {
            console.log(`Downlink to stop watering has been already sent or watering has already been stopped`);
        }
    }
    /** Scheduling a downlink for specific time. */
    schedule_downlink(data) {
        // Get waiting time
        if (data.watering_time) {
            const waiting_time = this.calculate_waiting_time(data.watering_time);
            // Wait a specific time before running sendDownlink
            this.timeoutID = setTimeout(() => {
                this.send_downlink(0);
            }, waiting_time);
            // Set waiting indicator to true
            this.waiting_for_timer = true;
            console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`);
        }
    }
    /** Function for sending downlinks.
     0: pump on, valve off
     1: valve on, pump off,
     2: everything off*/
    send_downlink(downlink_payload) {
        // Only allow downlink while ENABLE_DOWNLINK is set to true
        if (process.env.ENABLE_DOWNLINK != "true") {
            console.log(`ENABLE_DOWNLINK is set to false. Change it in the enviroment variables to allow downlinks.`);
            return;
        }
        else {
            console.log(`Sending Downlink. Payload is: ${downlink_payload}`);
        }
        // Check if theres enought water in zistern otherwise open valve for watering.
        let waterlevel = distance_sensor_1.Distance_sensor.getInstance.get_waterlevel;
        if (waterlevel <= this.min_waterlevel) {
            if (downlink_payload == 0) {
                if (waterlevel == -1) {
                    console.log(`Waterlevel not measured yet! Wait for distance sensor to send data.`);
                }
                else {
                    console.log(`Waterlevel below 10% (${waterlevel}).`);
                }
                console.log(`Using valve for watering!`);
                downlink_payload = 1;
            }
        }
        let app1 = "kaspersa-hfu-bachelor-thesis";
        let wh1 = "webapp";
        let dev1 = "eui-70b3d57ed005c853";
        // Prepare payload data
        let data = JSON.stringify({
            "downlinks": [{
                    "decoded_payload": {
                        "on_off": downlink_payload
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
        // update controlling variables
        console.log(`Waiting => false`);
        this.waiting_for_timer = false;
        this.last_soil_downlink = downlink_payload;
    }
    /** Returns the value of the last downlink. */
    get get_last_soil_downlink() {
        return this.last_soil_downlink;
    }
    /** Calculate waiting time. */
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
    /** Sending dircet downlink for pump controll with either 0 or 2. */
    direct_downlink() {
        if (this.last_soil_downlink == 2) {
            this.send_downlink(0);
        }
        else {
            this.send_downlink(2);
        }
    }
    /** Check if rain amount is above 0.5mm. */
    check_for_rain(extended_data) {
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
exports.Soil_sensor = Soil_sensor;
