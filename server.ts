import express from "express";
import { getEntries, updateDB } from "./db";
const app = express();
app.use(express.static("views"));
app.set("view engine", "ejs");

// Show db entries on load
app.get('/', async (req, res) => {
    let entries = await getEntries() || [];
    res.render("index", { entries });
});
  
//replace req.body. with data from ttn
app.post('/update', (req, res) => {
    let id = req.body.id;
    let entrie = {
        name: req.body.name || "none",
        time: req.body.time  || "none",
        temperature: req.body.temperature || "none",
        humidity: req.body.humidity  || "none",
        level: req.body.level  || "none",
        gateway: req.body.gateway  || "none",
        watering_amount: req.body.watering_amount  || "none",
        watering_time: req.body.watering_time  || "none"
    };
    updateDB(id,entrie);
});



/*
app.put('/', (req, res) => {
    res.send("recieved put");
});

app.delete('/', (req, res) => {
    res.send("recieved delete");
});*/

app.listen(8000);
