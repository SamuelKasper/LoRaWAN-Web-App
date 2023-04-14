import express from "express";
import http from "http";
import { getEntries, updateDB, updateDBbyUplink } from "./db";
const app = express();
app.use(express.static("views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");
 
// Show db entries on load
app.get('/', async (req, res) => {
    let entries = await getEntries() || [];
    // Reacting to data
    for(let i=0;i<entries.length;i++){
        //soil_humidity status
        if(entries[i].soil_humidity != "undefined"){
            let humStatus = ""
            entries[i].soil_humidity=entries[i].soil_humidity.replace("%","");
            if(parseInt(entries[i].soil_humidity) <50){
                humStatus = "Ja";
            }else if(parseInt(entries[i].soil_humidity) >=50){
                humStatus = "Nein";        
            }
            entries[i].humStatus = humStatus;
            entries[i].soil_humidity=entries[i].soil_humidity+"%";
        }

        //
        if(entries[i].distance != "undefined"){
            let max = parseInt(entries[i].max_distance) * 10;
            let dist = parseInt(entries[i].distance);
            let percent = parseInt(entries[i].distance)/max*100; 
            let percent_str = percent.toFixed(1);
            entries[i].distance = percent_str+"% ("+ dist/10+"cm)";
        }
    }
    // test end
    res.render("index", { entries });
});

// recieves uplink from webhook
// to test this with postman, place .data after jsonObj. Must be removed bedore uploading to render!
app.post('/uplink', async (req, res) => {
    // parse request body into a jsonObj.
    let jsonObj = JSON.parse(JSON.stringify(req.body));
    // use dev_eui as identifier to get the mongodb id later
    let dev_eui = jsonObj.end_device_ids.dev_eui;
 
    let data = {
        name: <String> jsonObj.end_device_ids.device_id,
        gateway: jsonObj.uplink_message.rx_metadata[0].gateway_ids.gateway_id,
        //air
        air_temperature: jsonObj.uplink_message.decoded_payload.TempC_SHT,
        air_humidity: jsonObj.uplink_message.decoded_payload.Hum_SHT,
        //soil
        soil_temperature: jsonObj.uplink_message.decoded_payload.temp_SOIL,
        soil_humidity: jsonObj.uplink_message.decoded_payload.water_SOIL,
        //waterlevel
        distance: jsonObj.uplink_message.decoded_payload.distance,
        //
        time: jsonObj.received_at.toLocaleString('de-DE'),
        dev_eui: jsonObj.end_device_ids.dev_eui,
        rssi: jsonObj.uplink_message.rx_metadata[0].rssi,

        //init values.
        //fields that can be changed by the user. Only applied at first appearance in db. Later changed by /update.
        description: "Beschreibung...",
        watering_amount: "0",
        watering_time:"08:00",
        max_distance:"0"
    }

    await updateDBbyUplink(dev_eui,data);
    // respond to ttn. Otherwise the uplink will fail.
    res.sendStatus(200);
});
  
// updates the user input fields.
app.post('/update', async (req, res) => {
    let id = req.body.dbid; 
    console.log(req.body);
    let entrie = {
        description: req.body.description || "undefined",
        watering_amount: req.body.watering_amount  || "undefined",
        watering_time: req.body.watering_time  || "undefined",
        max_distance: req.body.max_distance || "undefined"
    };
    await updateDB(id,entrie); 
    // relode page
    res.redirect('back');
});

// wip
/*
function sendDownlink(){
    let app1 = "kaspersa-hfu-bachelor-thesis";
    let wh1 = "webapp";
    let dev1 = "eui-70b3d57ed005c853";
    fetch(`https://eu1.cloud.thethings.network/api/v3/as/applications/${app1}/webhooks/${wh1}/devices/${dev1}/down/push`,{
        method: "POST",
        body: JSON.stringify({
            downlinks:[{
                // 01 -> D3 = on 
                // 10 -> D7 = off
                frm_payload:"01",
                f_port:15,
                priority:"NORMAL"
            }]
        }),
        headers: {
            "Content-type":"application/json;",
            "Authorization":"",
            "User-Agent":"webapp/1.0"
        }
    });
}
*/
app.listen(8000);
