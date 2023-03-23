import {MongoClient, ObjectId} from "mongodb";

// returns MongoClient
async function getClient(){
    return new MongoClient("mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority");
}

//Get DB enties and saves them in temp
export async function getEntries(){
    let client = await getClient();
    try{
        await client.connect();
        const db_entries = client.db("lorawan_data").collection("sensor_data");
        let entries = await db_entries.find().toArray();
        entries.forEach(entrie => {
            entrie.time = new Date(entrie.time).toLocaleString("de-DE");
        });
        return entries; 
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
} 

// Updates a db entrie
export async function updateDB(_id: string, item: {}){
    let client = await getClient();
    try{
        await client.connect();
        const collection = client.db("lorawan_data").collection("sensor_data");
        collection.updateOne({"_id": new ObjectId(_id)},{$set: item});
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}