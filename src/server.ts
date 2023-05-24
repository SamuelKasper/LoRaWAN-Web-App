import express from "express";
import { Route_default } from "./routes/route_default";
import { Route_direct_downlink } from "./routes/route_direct_downlink";
import { Route_uplink } from "./routes/route_uplink";
import { Route_update } from "./routes/route_update";
import { Instance_helper } from "./instance_helper";
import { Database } from "./db";
const app = express();

// Middleware
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");

// Create class for Routes 
let route_default = new Route_default();
let route_uplink = new Route_uplink();
let route_update = new Route_update();
let route_direct_downlink = new Route_direct_downlink();
let instance_helper = new Instance_helper();
let db = new Database();

// Express Routes
app.get('/', async (req, res) => {
    route_default.render_view(res, instance_helper, db);
});

app.post('/uplink', async (req, res) => {
    route_uplink.process_uplink(req, res, instance_helper, db);
});

app.post('/update', async (req, res) => {
    route_update.update_user_input(req, res, db);
});

app.post('/directDownlink', async (req, res) => {
    route_direct_downlink.prepare_downlink(req, res, instance_helper);
});

app.listen(8000);