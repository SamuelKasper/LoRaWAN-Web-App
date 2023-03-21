/*import express from "express";
const app = express();
app.use(express.static("public"));*/

//let temp1:HTMLTableColElement = <HTMLTableColElement> document.getElementById("temperature_1");
//temp1.innerHTML = i.temperature;
//document.getElementById("humidity_1")!.innerHTML = i.humidity;

async function get(): Promise<void> {
    //let url: string = "http://localhost:8000";
    let url: string = "https://lorawan-web-app.onrender.com";
    let resp = await (await fetch(url)).text();
    console.log(resp);

    //resp enthält die daten, die ins DOM sollen
}

get();

