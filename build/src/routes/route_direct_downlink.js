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
class Route_direct_downlink {
    /** Calling direct downlink from class Downlink. */
    prepare_downlink(req, res, inst) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get instance of class
            let sensor_data = JSON.parse(JSON.stringify(req.body));
            let id = sensor_data.dev_eui;
            let instance = inst.get_sensor_instance(id);
            instance.direct_downlink();
            // Reloade page
            res.redirect('back');
        });
    }
}
exports.Route_direct_downlink = Route_direct_downlink;