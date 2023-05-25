"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instance_helper = void 0;
class Instance_helper {
    constructor() {
        if (Instance_helper.instance) {
            throw new Error("Instance_helper can only have one class. Use Instance_helper.get_instance_helper().");
        }
        Instance_helper.instance = this;
    }
    /** Get instance for Instance_helper class. */
    static get get_instance_helper() {
        return this.instance;
    }
}
exports.Instance_helper = Instance_helper;
