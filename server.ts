import express from "express";
import url from "node:url";
import { getEntries, getFilteredEntries, updateDB } from "./db";
const app = express();
app.use(express.static("views"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

// Show db entries on load
app.get('/', async (req, res) => {
    let entries = await getEntries() || [];
    res.render("index", { entries });
});
  
//replace req.body. with data from ttn
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
    //window.location.reload();
});

//replace req.body. with data from ttn
app.post('/filter', async (req, res) => {
    let entrie = {
        type: req.body.filter_type,
        name: req.body.filter_search
    };
    let entries = await getFilteredEntries(entrie) || [];
    res.render("index", { entries });
});

app.listen(8000);
