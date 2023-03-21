"use strict";
/*import express from "express";
const app = express();
app.use(express.static("public"));*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//let temp1:HTMLTableColElement = <HTMLTableColElement> document.getElementById("temperature_1");
//temp1.innerHTML = i.temperature;
//document.getElementById("humidity_1")!.innerHTML = i.humidity;
function get() {
    return __awaiter(this, void 0, void 0, function* () {
        //let url: string = "http://localhost:8000";
        let url = "https://lorawan-web-app.onrender.com";
        let resp = yield (yield fetch(url)).text();
        console.log(resp);
        //resp enthält die daten, die ins DOM sollen
    });
}
get();
