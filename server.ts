import express from "express";
import { connectDB } from "./db";
const app = express();
app.use(express.static("views"));
app.set("view engine", "ejs");

app.get('/', async (req, res) => {
    let entries = await connectDB() || [];
    res.render("index", { entries });
});
  
/*
app.post('/', (req, res) => {
    res.send("recieved post");
});

app.put('/', (req, res) => {
    res.send("recieved put");
});

app.delete('/', (req, res) => {
    res.send("recieved delete");
});*/

app.listen(8000);
