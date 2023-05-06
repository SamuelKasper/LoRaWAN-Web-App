import express from "express";
import * as dotenv from "dotenv";
import { Routes } from "./routes";
const app = express();

// Middleware
app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
// Use enviroment variables
dotenv.config();

// Create class for Routes 
let routes = new Routes();

// Express Routes
app.get('/', async (req, res) => {
    routes.default(res);
});

app.post('/uplink', async (req, res) => {
    routes.uplink(req, res);
});

app.post('/update', async (req, res) => {
    routes.update(req, res);
});

app.post('/directDownlink', async (req, res) => {
    routes.direct_downlink(req, res);
});

app.listen(8000);