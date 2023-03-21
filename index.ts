import express from "express";
import {MongoClient} from "mongodb";

const app = express();
const port = 8000;

/*app.get("/", (req, res) => { 
    res.send("Hello!");
});*/

app.use(express.static("public"));

/*app.listen(port, () =>{
    console.log(`listening on ${port}`);
});*/

async function connectDB(){
    const uri = "mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri);
    try{
        await client.connect();
        await listDB(client);
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

async function listDB(client: MongoClient){
    const dbList = await client.db().admin().listDatabases();
    dbList.databases.forEach(db => {
        console.log(db.name);
    })
} 

connectDB();