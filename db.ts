import {MongoClient, ObjectId} from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

// Returns MongoClient
async function getClient(){
    return new MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority`);
}

// Get DB enties and saves them in temp
export async function db_getEntries(){
    let client = await getClient();
    try{
        await client.connect();
        const db_entries = client.db("lorawan_data").collection("sensor_data");
        let entries = await db_entries.find().toArray();
        entries.forEach(entrie => {
            entrie.time = new Date(entrie.time).toLocaleString("de-DE",{timeZone: "Europe/Berlin"});
        });
        return entries; 
    }catch(e){
        console.error(e); 
    } finally {
        await client.close();
    }    
} 

// Updates the editable fields 
export async function db_updateEditableFields(_id: string, item: {}){
    let client = await getClient();
    try{
        await client.connect();
        const collection = client.db("lorawan_data").collection("sensor_data");
        await collection.updateOne({"_id": new ObjectId(_id)},{$set: item});
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

// Updates a db entrie or add a new one. Triggert by TTN Uplink
export async function db_updateDBbyUplink(_devEUI: string, data: {}, base_data:{}){
    let client = await getClient();
    try{
        // Get db entrie by given dev_eui and save it in result
        await client.connect();
        const collection = client.db("lorawan_data").collection("sensor_data");
        let result = await collection.find({"dev_eui":_devEUI}).toArray();

        // No db entrie was found
        if(result.length == 0){
            let insert_data = JSON.parse(JSON.stringify(data));
            let res = await collection.insertOne(insert_data);
            console.log("Generated new db entrie with id: " +res.insertedId);
        }else{
            // if there is a db entry, get id from entrie and update
            let obj_id = JSON.parse(JSON.stringify(result));
            let insert_data = JSON.parse(JSON.stringify(base_data));
            let res = await collection.updateOne({"_id": new ObjectId(obj_id[0]._id)},{$set: insert_data});
            console.log("found: "+ res.matchedCount +" entrie.", "\nupdated id: " + obj_id[0]._id);
        }
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

