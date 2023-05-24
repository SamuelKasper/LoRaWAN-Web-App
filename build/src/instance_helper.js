"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instance_helper = void 0;
const soil_sensor_1 = require("./soil_sensor");
class Instance_helper {
    constructor() {
        this.sensors = {};
        if (Instance_helper.instance) {
            throw new Error("Instance_helper can only have one class. Use Instance_helper.get_instance_helper().");
        }
        Instance_helper.instance = this;
    }
    /** Get instance for Instance_helper class. */
    static get get_instance_helper() {
        return this.instance;
    }
    /** Get instance of class by dev_eui of Sensor. */
    get_sensor_instance(id) {
        console.log(this.sensors);
        if (!this.sensors[id]) {
            this.sensors[id] = new soil_sensor_1.Soil_sensor;
        }
        return this.sensors[id];
    }
}
exports.Instance_helper = Instance_helper;
