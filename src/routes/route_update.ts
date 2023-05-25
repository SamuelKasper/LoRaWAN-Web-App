import { Request, Response } from "express";
import { Database } from "../db";

export class Route_update {
    /** Processing data from user input fields send by form submit. */
    public async update_user_input(req: Request, res: Response, db: Database) {
        let entrie = {};
        // Update data of soil sensor
        if (req.body.watering_time) {
            entrie = {
                description: req.body.description.toString(),
                watering_time: req.body.watering_time.toString(),
                time_control: req.body.time_control ? req.body.time_control : "false",
                weather_control: req.body.weather_control ? req.body.weather_control : "false",
                hum_min: parseInt(req.body.hum_min),
                hum_max: parseInt(req.body.hum_max),
            };
            // Update data of distance sensor
        } else if (req.body.max_distance) {
            entrie = {
                description: req.body.description.toString(),
                max_distance: parseInt(req.body.max_distance),
            };
            // Update data of other sensors without special fields
        } else {
            entrie = {
                description: req.body.description.toString(),
            };
        }

        // Update db
        await db.update_user_input(req.body.dbid, entrie);

        // Reloade page
        res.redirect('back');
    }
}