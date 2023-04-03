import express from "express";
import { getEntries, updateDB, updateDBbyUplink } from "./db";
const app = express();
app.use(express.static("views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");
 
// Show db entries on load
app.get('/', async (req, res) => {
    let entries = await getEntries() || [];
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
        temperature: jsonObj.uplink_message.decoded_payload.TempC_SHT,
        humidity: jsonObj.uplink_message.decoded_payload.Hum_SHT,
        time: jsonObj.received_at,
        dev_eui: jsonObj.end_device_ids.dev_eui,
        rssi: jsonObj.uplink_message.rx_metadata[0].rssi,

        //fields that can be changed by the user. Only applied at first appearance.
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

app.listen(8000);
