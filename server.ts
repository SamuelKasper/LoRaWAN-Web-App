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
    // test for reaacting to data
    for(let i=0;i<entries.length;i++){
        let tempStatus = "";
        let humStatus = ""
        // Temperature
        if(parseInt(entries[i].temperature) <0){
            tempStatus = "sehr kalt";
        }else if(parseInt(entries[i].temperature) <15){
            tempStatus = "kalt";
        }else if(parseInt(entries[i].temperature) >=15 && parseInt(entries[i].temperature) <=22){
            tempStatus = "raumtemperatur";
        }else if(parseInt(entries[i].temperature) >22){
            tempStatus = "warm";
        }
        entries[i].tempStatus = tempStatus;

        // Humidity
        if(parseInt(entries[i].humidity) <50){
            humStatus = "Ja";
        }else if(parseInt(entries[i].temperature) >=50){
            humStatus = "Nein";        
        }
        entries[i].humStatus = humStatus;
    }
    // test end
    
    console.log(entries);
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
        name: jsonObj.end_device_ids.device_id,
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
        description: "",
        watering_amount: "0",
        watering_time:"08:00"
    }

    await updateDBbyUplink(dev_eui,data);
    // respond to ttn. Otherwise the uplink will fail.
    res.sendStatus(200);
});
  
// updates the user input fields.
app.post('/update', async (req, res) => {
    let id = req.body.dbid;
    let entrie = {
        description: req.body.description || "none",
        watering_amount: req.body.watering_amount  || "none",
        watering_time: req.body.watering_time  || "none"
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
            "Authorization":"Bearer NNSXS.72OYCYYVWWBJ34RGKN4VGVXVM7LVRQRVEWAYP7Q.W2KBBVTF6KWNNEMTWD43XWOWSFQZ3IUU7BCGH24XZ7FEWZHYI5KQ",
            "User-Agent":"webapp/1.0"
        }
    });
}
*/
app.listen(8000);
