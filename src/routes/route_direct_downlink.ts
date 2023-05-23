import { Request, Response } from "express";
import { DB } from "../db";
import { Instance_helper } from "../instance_helper";

export class Route_direct_downlink {
    /** Calling direct downlink from class Downlink. */
    public async main(req: Request, res: Response, instance_helper: Instance_helper, db: DB) {
        // Get instance of class
        let sensor_data = JSON.parse(JSON.stringify(req.body));
        let id = sensor_data.dev_eui;
        let instance = instance_helper.get_sensor_instance(id);

        instance.direct_downlink();
        // Reloade page
        res.redirect('back');
    }
}