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
exports.Route_update = void 0;
class Route_update {
    /** Processing data from user input fields send by form submit. */
    update_user_input(req, res, db) {
        return __awaiter(this, void 0, void 0, function* () {
            let entrie = {};
            // Set values for data of soil sensor
            if (req.body.watering_time) {
                entrie = {
                    description: req.body.description.toString(),
                    watering_time: req.body.watering_time.toString(),
                    time_control: req.body.time_control ? req.body.time_control : "false",
                    weather_control: req.body.weather_control ? req.body.weather_control : "false",
                    relais_nr: req.body.relais_nr ? req.body.relais_nr : 3,
                    hum_min: parseInt(req.body.hum_min),
                    hum_max: parseInt(req.body.hum_max),
                };
                // Set values for data of distance sensor
            }
            else if (req.body.max_distance) {
                entrie = {
                    description: req.body.description.toString(),
                    max_distance: parseInt(req.body.max_distance),
                };
                // Set values for data of other sensors without special fields
            }
            else {
                entrie = {
                    description: req.body.description.toString(),
                };
            }
            // Update db with given options
            yield db.update_user_input(req.body.dbid, entrie);
            // Reloade page
            res.redirect('back');
        });
    }
}
exports.Route_update = Route_update;
