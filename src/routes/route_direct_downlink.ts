import { Request, Response } from "express";
import { Instance_helper } from "../instance_helper";

export class Route_direct_downlink {
    /** Calling direct downlink from class Downlink. */
    public async prepare_downlink(req: Request, res: Response, inst: Instance_helper) {
        // Get instance of class
        let sensor_data = JSON.parse(JSON.stringify(req.body));
        let id = sensor_data.dev_eui;
        let instance = inst.get_sensor_instance(id);

        instance.direct_downlink();
        // Reloade page
        res.redirect('back');
    }
}