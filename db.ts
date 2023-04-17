import {MongoClient, ObjectId} from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

// returns MongoClient
async function getClient(){
    return new MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority`);
}

//Get DB enties and saves them in temp
export async function getEntries(){
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

// Updates a db entrie
export async function updateDB(_id: string, item: {}){
    let client = await getClient();
    try{
        await client.connect();
        const collection = client.db("lorawan_data").collection("sensor_data");
        
        // der hier drunter geht nicht
        await collection.updateOne({"_id": new ObjectId(_id)},{$set: item});
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

// Updates a db entrie or adds a new one. Called by ttn uplink.
export async function updateDBbyUplink(_dev_eui: string,item: {}){
    let client = await getClient();
    try{
        // connect to db and get collection object
        await client.connect();
        const collection = client.db("lorawan_data").collection("sensor_data");
        // get the db entrie by looking at the dev_eui
        let result = await collection.find({"dev_eui":_dev_eui}).toArray();

        // if theres no db entrie, make a new one
        if(result.length == 0){
            let obj = JSON.parse(JSON.stringify(item));
            let res = await collection.insertOne({
                gateway:`${obj.gateway}`,air_temperature:`${obj.air_temperature}`,air_humidity:`${obj.air_humidity}`,
                soil_temperature:`${obj.soil_temperature}`,soil_humidity:`${obj.soil_humidity}`,distance:`${obj.distance}`,
                time:`${obj.time}`,dev_eui:`${obj.dev_eui}`,name:`${obj.name}`,max_distance:`${obj.max_distance}`,
                hum_min:`${obj.hum_min}`,hum_max:`${obj.hum_max}`,description:`${obj.description}`,watering_time:`${obj.watering_time}`,rssi:`${obj.rssi}`});
            
                console.log("Generated new entrie with id: " +res.insertedId);
        }else{
            // if there is a db entry, get id from entrie and update
            let res_obj = JSON.parse(JSON.stringify(result));
            let obj = JSON.parse(JSON.stringify(item));

            let res = await collection.updateOne({"_id": new ObjectId(res_obj[0]._id)},{$set:{
                gateway:`${obj.gateway}`,air_temperature:`${obj.air_temperature}`,air_humidity:`${obj.air_humidity}`,
                soil_temperature:`${obj.soil_temperature}`,soil_humidity:`${obj.soil_humidity}`,distance:`${obj.distance}`,
                time:`${obj.time}`,dev_eui:`${obj.dev_eui}`,rssi:`${obj.rssi}`}});

            console.log("found: "+ res.matchedCount +" entrie.", "\nupdated id: " + res_obj[0]._id);
        }
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

