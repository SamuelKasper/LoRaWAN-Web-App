"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.static("public"));
//let temp1:HTMLTableColElement = <HTMLTableColElement> document.getElementById("temperature_1");
//temp1.innerHTML = i.temperature;
//document.getElementById("humidity_1")!.innerHTML = i.humidity;
/*async function get(): Promise<void> {
    //let url: string = "http://localhost:8000";
    let url: string = "https://lorawan-web-app.onrender.com";
    let resp = await (await fetch(url)).text();
    console.log(resp);

    //resp enthält die daten, die ins DOM sollen
}*/
//get();
