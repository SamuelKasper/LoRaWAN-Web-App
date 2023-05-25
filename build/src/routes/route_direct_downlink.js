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
class Route_direct_downlink {
    /** Calling direct downlink for specific instance of Soil_sensor. */
    prepare_downlink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get instance of class
            let sensor_data = JSON.parse(JSON.stringify(req.body));
            let id = sensor_data.dev_eui;
            let instance = (0, server_1.get_sensor_instance)(id);
            instance.direct_downlink(sensor_data.relais_nr);
            console.log(`direct_downlink:\n id: ${id},\ninstance:`, instance);
            // Reloade page 
            res.redirect('back');
        });
    }
}
exports.Route_direct_downlink = Route_direct_downlink;
