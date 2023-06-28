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
exports.Route_default = void 0;
const server_1 = require("../server");
const route_uplink_1 = require("./route_uplink");
class Route_default {
    /** Loading data from DB and displays it on default URL. */
    render_view(res, db) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = (yield db.get_entries()) || [];
            for (let i = 0; i < entries.length; i++) {
                // Calculate percentage for distance
                if (entries[i].distance) {
                    let max = entries[i].max_distance;
                    let dist = entries[i].distance;
                    let diff = max - dist;
                    let percent = 100 - (dist / max * 100);
                    let percent_str = percent.toFixed(1);
                    entries[i].distance = `${percent_str} % (${diff.toFixed(1)} cm)`;
                    // Add propertie alert to entries to decide if alert should be called in ejs.
                    if (percent < 10) {
                        entries[i].alert = "warning";
                    }
                }
                // Overwrite Signalstrength in RSSI with Text
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
                // Add Status for watering
                if (entries[i].soil_humidity) {
                    // Get instance of class
                    let id = entries[i].dev_eui;
                    let instance = (0, server_1.get_sensor_instance)(id);
                    if (instance.valve_open && route_uplink_1.Route_uplink.watering_rn) {
                        entries[i].last_soil_downlink = "Bewässerung ist aktiv";
                    }
                    else {
                        entries[i].last_soil_downlink = "Bewässerung ist inaktiv";
                    }
                }
            }
            // Render the page with given options
            res.render("index", { entries });
        });
    }
}
exports.Route_default = Route_default;
