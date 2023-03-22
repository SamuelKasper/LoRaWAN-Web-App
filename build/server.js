"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.get('/', (req, res) => {
    res.render("index", { time: "00:00:00", temperature: "21°C", humidity: "44%", gateway: "my_gateway" });
});
app.post('/', (req, res) => {
    res.send("recieved post");
});
app.put('/', (req, res) => {
    res.send("recieved put");
});
app.delete('/', (req, res) => {
    res.send("recieved delete");
});
app.listen(8000);
