import {MongoClient} from "mongodb";

// connects to mongodb | calls getEntries()
export async function connectDB(){
    const uri = "mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority"
    const client = new MongoClient(uri);
    try{
        await client.connect();
        return await getEntries(client);
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

//Get DB enties and saves them in temp
async function getEntries(client: MongoClient){
    const db_entries = client.db("lorawan_data").collection("sensor_data");
    let entries = await db_entries.find().toArray();
    entries.forEach(entrie => {
        entrie.time = new Date(entrie.time).toLocaleString("de-DE");
    })
    return entries;
} 