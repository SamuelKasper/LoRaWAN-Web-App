import express from "express";
import { getEntries, updateDB } from "./db";
const app = express();
app.use(express.static("views"));
//Einkommentieren damit speichern in db klappt
//app.use(express.urlencoded({extended: true}));
//Einkommentieren damit daten empfangen von Postman klappt
app.use(express.json());
app.set("view engine", "ejs");

// Show db entries on load
app.get('/', async (req, res) => {
    let entries = await getEntries() || [];
    res.render("index", { entries });
});

// recieves uplink from webhook
app.post('/uplink', async (req, res) => {
    //TODO: decide if device is already in db or is a new device
    let id = "641afb263c5c12d453f2f48e";
    let data = {
        gateway: req.body.data.uplink_message.rx_metadata[0].gateway_ids.gateway_id,
        temperature: req.body.data.uplink_message.decoded_payload.TempC_SHT,
        humidity: req.body.data.uplink_message.decoded_payload.Hum_SHT,
        time: req.body.data.received_at,
        //user input
        name: req.body.identifiers[0].device_ids.device_id,
        watering_amount: req.body.watering_amount  || "none",
        watering_time: req.body.watering_time  || "none"
    }
    await updateDB(id,data);
    res.redirect('back');
});
  
//needs: app.use(express.urlencoded({extended: true})); to work
app.post('/update', async (req, res) => {
    let id = req.body.dbid;
    let entrie = {
        name: req.body.name || "none",
        watering_amount: req.body.watering_amount  || "none",
        watering_time: req.body.watering_time  || "none"
    };
    await updateDB(id,entrie);
    // relode page
    res.redirect('back');
});

app.listen(8000);
