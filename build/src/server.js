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
const express_1 = __importDefault(require("express"));
const route_default_1 = require("./routes/route_default");
const route_direct_downlink_1 = require("./routes/route_direct_downlink");
const route_uplink_1 = require("./routes/route_uplink");
const route_update_1 = require("./routes/route_update");
const instance_helper_1 = require("./instance_helper");
const db_1 = require("./db");
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
let instance_helper = new instance_helper_1.Instance_helper();
let db = new db_1.DB();
// Express Routes
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_default.main(res, instance_helper, db);
}));
app.post('/uplink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_uplink.main(req, res, instance_helper, db);
}));
app.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_update.main(req, res, db);
}));
app.post('/directDownlink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    route_direct_downlink.main(req, res, instance_helper, db);
}));
app.listen(8000);
