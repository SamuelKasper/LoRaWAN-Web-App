import { Response } from "express";
import { Database } from "../db";
import { get_sensor_instance } from "../server";

export class Route_default {
    
    /** Loading data from DB and displays it on default URL. */
    public async render_view(res: Response, db: Database) {
        let entries = await db.get_entries() || [];

        for (let i = 0; i < entries.length; i++) {
            // Calculate percentage for distance
            if (entries[i].distance) {
                let max: number = entries[i].max_distance;
                let dist: number = entries[i].distance;
                let diff = max - dist;
                let percent: number = 100 - (dist / max * 100);
                let percent_str: string = percent.toFixed(1);
                entries[i].distance = `${percent_str} % (${diff.toFixed(1)} cm)`;
                // Add message if zistern water level is below 10%
                if (percent < 10) {
                    entries[i].alert = "warning";
                }
            }

            // Add text for RSSI
            switch (true) {
                case entries[i].rssi > -100:
                    entries[i].rssi = "Sehr gut";
                    break;
                case entries[i].rssi > -105:
                    entries[i].rssi = "Gut";
                    break;
                case entries[i].rssi > -115:
                    entries[i].rssi = "Ausreichend";
                    break;
                case entries[i].rssi <= -115:
                    entries[i].rssi = "Schlecht";
                    break;
            }

            // Add parameter to check watering status
            if (entries[i].soil_humidity) {
                // Get instance of class
                let id = entries[i].dev_eui;
                let instance = get_sensor_instance(id);
                console.log(id, instance);
                if (instance.get_last_soil_downlink == 0) {
                    entries[i].last_soil_downlink = "Bewässerung ist aktiv (Zisterne)";
                } else if (instance.get_last_soil_downlink == 1) {
                    entries[i].last_soil_downlink = "Bewässerung ist aktiv (Grundwasser)";
                } else {
                    entries[i].last_soil_downlink = "Bewässerung ist inaktiv";
                }
            }
        }
        // Render the page with given entries
        res.render("index", { entries });
    }
}