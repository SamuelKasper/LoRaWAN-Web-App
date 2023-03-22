import express from "express";
const app = express();

app.set("view engine", "ejs");

app.get('/', (req, res)=>{
    res.render("index", 
    {time: "00:00:00", temperature: "21°C", humidity: "44%", gateway: "my_gateway"});
});
 
app.post('/', (req, res)=>{
    res.send("recieved post");
}); 

app.put('/', (req, res)=>{
    res.send("recieved put");
});

app.delete('/', (req, res)=>{
    res.send("recieved delete"); 
}); 

app.listen(8000);