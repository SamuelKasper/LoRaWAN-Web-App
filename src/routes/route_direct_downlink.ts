import { Request, Response } from "express";
import { any_valve_open, get_sensor_instance } from "../server";
import { Route_uplink } from "./route_uplink";

export class Route_direct_downlink {
    /** Calling direct downlink for specific instance of soil_sensor. */
    public async prepare_downlink(req: Request, res: Response) {
        // Get instance of class and call prepare_payload with relais_nr
        let sensor_data = JSON.parse(JSON.stringify(req.body));
        let id = sensor_data.dev_eui;
        let instance = get_sensor_instance(id);
        await instance.prepare_payload(parseInt(sensor_data.relais_nr));

        // Check if any valve is open. If not stop watering.
        if (!any_valve_open()) {
            if (Route_uplink.watering_rn == true) {
                instance.downlink(0, 0);
                Route_uplink.watering_rn = false;
            } else {
                console.log("Route_uplink: Watering already stopped.");
            }
        }

        // Reloade page 
        res.redirect('back');
    }
}