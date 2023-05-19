"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Distance_sensor = void 0;
class Distance_sensor {
    constructor() {
        this.waterlevel_percent = -1;
    }
    /** Get instance for Distance_sensor class. */
    static get getInstance() {
        return this.instance;
    }
    /** Setting value for waterlevel_percent. */
    set_waterlevel(data) {
        if (data.max_distance != undefined && data.distance != undefined) {
            this.waterlevel_percent = 100 - (data.distance / data.max_distance * 100);
            console.log("Set waterlevel to: ", this.waterlevel_percent);
        }
    }
    /** Returning value for waterlevel_percent. */
    get get_waterlevel() {
        return this.waterlevel_percent;
    }
}
exports.Distance_sensor = Distance_sensor;
