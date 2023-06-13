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
exports.Route_direct_downlink = void 0;
const server_1 = require("../server");
const route_uplink_1 = require("./route_uplink");
class Route_direct_downlink {
    /** Calling direct downlink for specific instance of Soil_sensor. */
    prepare_downlink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get instance of class
            let sensor_data = JSON.parse(JSON.stringify(req.body));
            let id = sensor_data.dev_eui;
            let instance = (0, server_1.get_sensor_instance)(id);
            yield instance.prepare_payload(sensor_data.relais_nr);
            // Check if any valve if open. If not stop watering.
            if (!(0, server_1.any_valve_open)()) {
                if (route_uplink_1.Route_uplink.watering_rn == true) {
                    instance.downlink(0, 2);
                    route_uplink_1.Route_uplink.watering_rn = false;
                }
                else {
                    console.log("Route_uplink: Watering already stopped.");
                }
            }
            // Reloade page 
            res.redirect('back');
        });
    }
}
exports.Route_direct_downlink = Route_direct_downlink;
