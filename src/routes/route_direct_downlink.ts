import { Request, Response } from "express";
import { get_sensor_instance } from "../server";

export class Route_direct_downlink {
    /** Calling direct downlink from class Downlink. */
    public async prepare_downlink(req: Request, res: Response) {
        // Get instance of class
        let sensor_data = JSON.parse(JSON.stringify(req.body));
        let id = sensor_data.dev_eui;
        let instance = get_sensor_instance(id);

        instance.direct_downlink();
        console.log(`direct_downlink:\n id: ${id},\ninstance:`, instance);
        // Reloade page
        res.redirect('back');
    }
}