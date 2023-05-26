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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Soil_sensor = void 0;
const fetch = require("node-fetch");
const distance_sensor_1 = require("./distance_sensor");
const server_1 = require("./server");
class Soil_sensor {
    constructor() {
        this.waiting_for_timer = false;
        this.last_watering_time = "08:00";
        this.last_soil_downlink = 2;
        this.min_waterlevel = 10;
        this.valve_1 = false;
        this.valve_2 = false;
    }
    /** Checking if humidity is below or above the border values. */
    check_humidity(data) {
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
            else if (humidity > data.hum_max) {
                // Stop watering if not already done
                if (this.last_soil_downlink != 2) {
                    console.log("Sending downlink to stop watering.");
                    yield this.downlink(0, 2);
                    this.last_soil_downlink = 2;
                }
                else {
                    console.log("Watering already stopped.");
                }
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
            this.watering_by_boardervalue(data);
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
            clearTimeout(this.timeout_id);
            // Schedule downlink
            this.schedule_downlink(data);
        }
    }
    /** Sending downlink to start watering by boardervalues. */
    watering_by_boardervalue(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Time control is turned off.`);
            // If watering is inactive
            if (this.last_soil_downlink == 2) {
                // Delete former timeout if existing
                if (this.timeout_id) {
                    clearTimeout(this.timeout_id);
                }
                if (data.relais_nr != undefined) {
                    yield this.prepare_downlink(data.relais_nr);
                }
                else {
                    console.log("relais nr is: ", data.relais_nr);
                }
            }
            else {
                console.log(`Watering is already active.`);
            }
        });
    }
    /** Scheduling a downlink for specific time. */
    schedule_downlink(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get waiting time
            if (data.watering_time) {
                const waiting_time = this.calculate_waiting_time(data.watering_time);
                // Wait a specific time before running sendDownlink
                this.timeout_id = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    if (data.relais_nr != undefined) {
                        yield this.prepare_downlink(data.relais_nr);
                    }
                    else {
                        console.log("relais nr is: ", data.relais_nr);
                    }
                }), waiting_time);
                // Set waiting indicator to true
                this.waiting_for_timer = true;
                console.log(`Downlink planned at: ${data.watering_time}. ${(waiting_time / 1000 / 60).toFixed(1)} min left.`);
            }
        });
    }
    /** Preparing payload and sending downlinks for opening / closing valves and start / stop the watering. */
    prepare_downlink(valve) {
        return __awaiter(this, void 0, void 0, function* () {
            // Open the valve, given as parameter. 1 = relais 3, 2 = relais 4
            let payload_valve;
            if (valve == 1) {
                payload_valve = 3;
            }
            else {
                payload_valve = 4;
            }
            // Set values to check if valve is open or closed
            if (valve == 1) {
                if (this.valve_1) {
                    this.valve_1 = false;
                }
                else {
                    this.valve_1 = true;
                }
            }
            else {
                if (this.valve_2) {
                    this.valve_2 = false;
                }
                else {
                    this.valve_2 = true;
                }
            }
            console.log("valve_1: ", this.valve_1);
            console.log("valve_2: ", this.valve_2);
            // Call downlink to start watering if at least one valve is open
            if (this.valve_1 || this.valve_2) {
                let payload_watering;
                let waterlevel = distance_sensor_1.Distance_sensor.getInstance.get_waterlevel;
                if (waterlevel <= this.min_waterlevel) {
                    if (waterlevel == -1) {
                        console.log(`Waterlevel not measured yet! Wait for distance sensor to send data.`);
                    }
                    else {
                        console.log(`Waterlevel below 10% (${waterlevel}).`);
                    }
                    console.log(`Using valve for watering!`);
                    // Not enough water in zistern
                    payload_watering = 1;
                }
                else {
                    // Enough water in zistern
                    payload_watering = 0;
                }
                yield this.downlink(payload_valve, payload_watering);
                // update controlling variables
                this.last_soil_downlink = payload_watering;
                this.waiting_for_timer = false;
                console.log(`Waiting => false; last_soil_downlink = ${this.get_last_soil_downlink}`);
            }
            if (!this.any_valve_open()) {
                yield this.downlink(0, 2);
                this.last_soil_downlink = 2;
            }
        });
    }
    /** Returns true if any valve is open. */
    any_valve_open() {
        // Check all instances for open valves. If every valve is closed stop watering.
        let all_instances = (0, server_1.get_all_instances)();
        return all_instances.some(instance => instance.valve_1 || instance.valve_2);
        /* for (const instance of all_instances) {
            if (instance.valve_1 || instance.valve_2) {
                return true;
            }
        }
        return false; */
    }
    /** Sending downlink with given payload */
    downlink(payload_valve, payload_watering) {
        return __awaiter(this, void 0, void 0, function* () {
            let app1 = "kaspersa-hfu-bachelor-thesis";
            let wh1 = "webapp";
            let dev1 = "eui-70b3d57ed005c853";
            let url = `https://eu1.cloud.thethings.network/api/v3/as/applications/${app1}/webhooks/${wh1}/devices/${dev1}/down/push`;
            // Prepare payload data
            let data = JSON.stringify({
                "downlinks": [{
                        "decoded_payload": {
                            "on_off": payload_watering,
                            "valve": payload_valve
                        },
                        "f_port": 15,
                        "priority": "NORMAL"
                    }]
            });
            yield fetch(url, {
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
                .then((resp) => {
                console.log(`TTN Downlink Response: ${resp.statusText}`);
            })
                .catch(console.error);
        });
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
