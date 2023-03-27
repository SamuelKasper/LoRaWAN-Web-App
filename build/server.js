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
app.set("view engine", "ejs");
// Show db entries on load
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let entries = (yield (0, db_1.getEntries)()) || [];
    res.render("index", { entries });
}));
//replace req.body. with data from ttn
app.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let id = req.body.dbid;
    let entrie = {
        name: req.body.name || "none",
        watering_amount: req.body.watering_amount || "none",
        watering_time: req.body.watering_time || "none"
    };
    (0, db_1.updateDB)(id, entrie);
    // relode page
    let entries = (yield (0, db_1.getEntries)()) || [];
    res.render("index", { entries });
}));
/*
app.put('/', (req, res) => {
    res.send("recieved put");
});

app.delete('/', (req, res) => {
    res.send("recieved delete");
});*/
app.listen(8000);
