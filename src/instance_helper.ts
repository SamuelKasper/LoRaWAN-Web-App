import { Soil_sensor } from "./soil_sensor";

export class Instance_helper {
    private static instance: Instance_helper;

    constructor(){
        if(Instance_helper.instance){
            throw new Error("Instance_helper can only have one class. Use Instance_helper.get_instance_helper().");
        }
        Instance_helper.instance = this;
    }

    /** Get instance for Instance_helper class. */
    public static get get_instance_helper(){
        return this.instance;
    }

    private sensors: { [id: string]: Soil_sensor } = {};
    /** Get instance of class by dev_eui of Sensor. */
    public get_sensor_instance(id: string): Soil_sensor {
        console.log(this.sensors);
        if (!this.sensors[id]) {
            this.sensors[id] = new Soil_sensor;
        }
        return this.sensors[id];
    }
}