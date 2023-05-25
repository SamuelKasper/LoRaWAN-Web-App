"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_sensor_instance = void 0;
const express_1 = __importDefault(require("express"));
const route_default_1 = require("./routes/route_default");
const route_direct_downlink_1 = require("./routes/route_direct_downlink");
const route_uplink_1 = require("./routes/route_uplink");
const route_update_1 = require("./routes/route_update");
const db_1 = require("./db");
const soil_sensor_1 = require("./soil_sensor");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.static("views"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.set("view engine", "ejs");
// Create class for Routes 
let route_default = new route_default_1.Route_default();
let route_uplink = new route_uplink_1.Route_uplink();
let route_update = new route_update_1.Route_update();
let route_direct_downlink = new route_direct_downlink_1.Route_direct_downlink();
let db = new db_1.Database();
// Express Routes
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_default.render_view(res, db);
}));
app.post('/uplink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_uplink.process_uplink(req, res, db);
}));
app.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_update.update_user_input(req, res, db);
}));
app.post('/directDownlink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_direct_downlink.prepare_downlink(req, res);
}));
let sensors = {};
/** Get instance of class by dev_eui of Sensor. */
function get_sensor_instance(id) {
    if (!sensors[id]) {
        sensors[id] = new soil_sensor_1.Soil_sensor();
    }
    console.log(sensors);
    return sensors[id];
}
exports.get_sensor_instance = get_sensor_instance;
app.listen(8000);
