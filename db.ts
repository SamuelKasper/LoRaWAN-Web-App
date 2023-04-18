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
            let obj = JSON.parse(JSON.stringify(data));
            let res = await collection.insertOne({
                obj
                /*
                // Always there
                time: <string> obj.time,
                dev_eui: <string> obj.dev_eui,
                name: <string> obj.name,
                gateway: <string> obj.gateway,
                rssi: <number> obj.rssi, 
                // Sensor data
                air_temperature: <number> obj.air_temperature, 
                air_humidity: <number> obj.air_humidity,
                soil_temperature: <string> obj.soil_temperature, 
                soil_humidity: <string> obj.soil_humidity, 
                distance: <number> obj.distance,
                // Editable fields
                max_distance: <number> obj.max_distance, 
                hum_min: <number> obj.hum_min, 
                hum_max: <number> obj.hum_max,
                description: <string> obj.description,
                watering_time: <string> obj.watering_time,*/

                // Always there 
                /*time:`${obj.time}`,
                dev_eui:`${obj.dev_eui}`,
                name:`${obj.name}`,
                gateway:`${obj.gateway}`,
                rssi:`${obj.rssi}`,
                // Sensor data
                air_temperature:`${obj.air_temperature}`,
                air_humidity:`${obj.air_humidity}`,
                soil_temperature:`${obj.soil_temperature}`,
                soil_humidity:`${obj.soil_humidity}`,
                distance:`${obj.distance}`,
                // Editable fields
                max_distance: `${obj.max_distance}`,
                hum_min: `${obj.hum_min}`,
                hum_max: `${obj.hum_max}`,
                description:`${obj.description}`,
                watering_time:`${obj.watering_time}`*/
            });
                console.log("Generated new db entrie with id: " +res.insertedId);
        }else{
            // if there is a db entry, get id from entrie and update
            let res_obj = JSON.parse(JSON.stringify(result));
            let obj = JSON.parse(JSON.stringify(base_data));

            let res = await collection.updateOne({"_id": new ObjectId(res_obj[0]._id)},{
                obj
                /*$set:{
                gateway:`${obj.gateway}`,
                time:`${obj.time}`,
                dev_eui:`${obj.dev_eui}`,
                rssi:`${obj.rssi}`},
                // Sensor data
                air_temperature:`${obj.air_temperature}`,
                air_humidity:`${obj.air_humidity}`,
                soil_temperature:`${obj.soil_temperature}`,
                soil_humidity:`${obj.soil_humidity}`,
                distance:`${obj.distance}`*/
            });
            console.log("found: "+ res.matchedCount +" entrie.", "\nupdated id: " + res_obj[0]._id);
        }
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }    
}

