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
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use(express_1.default.static("views"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.set("view engine", "ejs");
// Show db entries on load
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let entries = (yield (0, db_1.getEntries)()) || [];
    res.render("index", { entries });
}));
// recieves uplink from webhook
app.post('/uplink', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //TODO: decide if device is already in db or is a new device
    // use dev_eui and add zeros at the end to fit 12byte and use it as id for mongodb
    let jsonObj = JSON.parse(JSON.stringify(req.body));
    //console.log(jsonObj.data.uplink_message.rx_metadata[0].gateway_ids.gateway_id);
    let id = "641afb263c5c12d453f2f48e";
    let data = {
        gateway: jsonObj.data.uplink_message.rx_metadata[0].gateway_ids.gateway_id,
        temperature: jsonObj.data.uplink_message.decoded_payload.TempC_SHT,
        humidity: jsonObj.data.uplink_message.decoded_payload.Hum_SHT,
        time: jsonObj.data.received_at,
        //user input
        name: jsonObj.data.end_device_ids.device_id,
        watering_amount: req.body.watering_amount || "none",
        watering_time: req.body.watering_time || "none"
    };
    yield (0, db_1.updateDB)(id, data);
    console.log(data);
    res.sendStatus(200);
    //res.redirect('back');
}));
//needs: app.use(express.urlencoded({extended: true})); to work
app.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let id = req.body.dbid;
    let entrie = {
        name: req.body.name || "none",
        watering_amount: req.body.watering_amount || "none",
        watering_time: req.body.watering_time || "none"
    };
    yield (0, db_1.updateDB)(id, entrie);
    // relode page
    res.redirect('back');
}));
app.listen(8000);
