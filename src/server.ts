import express from "express";
import { Route_default } from "./routes/route_default";
import { Route_direct_downlink } from "./routes/route_direct_downlink";
import { Route_uplink } from "./routes/route_uplink";
import { Route_update } from "./routes/route_update";
import { Database } from "./db";
import { Soil_sensor } from "./soil_sensor";
const app = express();

// Middleware
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");

// Class objects and variables
let route_default = new Route_default();
let route_uplink = new Route_uplink();
let route_update = new Route_update();
let route_direct_downlink = new Route_direct_downlink();
let db = new Database();
let sensors: { [id: string]: Soil_sensor } = {};

// Express Routes
app.get('/', async (req, res) => {
    route_default.render_view(res, db);
});

app.post('/uplink', async (req, res) => {
    route_uplink.process_uplink(req, res, db);
});

app.post('/update', async (req, res) => {
    route_update.update_user_input(req, res, db);
});

app.post('/directDownlink', async (req, res) => {
    route_direct_downlink.prepare_downlink(req, res);
});

/** Get instance of class by dev_eui of Sensor. */
export function get_sensor_instance(id: string): Soil_sensor {
    if (!sensors[id]) {
        sensors[id] = new Soil_sensor();
    }
    return sensors[id];
}

/** Returns true if any valve is open. */
export function any_valve_open() {
    // Check all instances for open valves. If any is open, return
    return Object.values(sensors).some(instance => instance.valve_open);
}

app.listen(8000);