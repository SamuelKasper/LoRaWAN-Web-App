import express from "express";
const app = express();
const port = 8000;

/*app.get("/", (req, res) => { 
    res.send("Hello!");
});*/

app.use(express.static("public"));

app.listen(port, () =>{
    console.log(`listening on ${port}`);
});