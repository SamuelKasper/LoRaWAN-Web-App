import {MongoClient} from "mongodb";
import * as Http from "http";

let server: Http.Server = Http.createServer();
server.addListener("request", handleRequest);
server.listen(8000);

let temp: String = "";

async function handleRequest(_request: Http.IncomingMessage, _response: Http.ServerResponse){
    console.log("Test");
    _response.setHeader("content-type", "text/html; charset=utf-8");
    _response.setHeader("Access-Control-Allow-Origin", "*");
    await connectDB();
    _response.write(temp);
    _response.end();
}



async function connectDB(){
    const uri = "mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri);
    try{
        await client.connect();
        await getEntries(client);
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

async function getEntries(client: MongoClient){
    const db_entries = client.db("lorawan_data").collection("sensor_data");
    let entries = await db_entries.find().toArray();
    entries.forEach(i => {
        console.log("\n");
        console.log("ID: " + i._id +"\ntemperature: " + i.temperature + "\nhumidity: " + i.humidity);
        temp = "ID: " + i._id +"\ntemperature: " + i.temperature + "\nhumidity: " + i.humidity;
    });
} 