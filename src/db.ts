import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

export class DB {
    // Returns MongoClient
    public async getClient() {
        return new MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority`);
    }

    // Get DB enties and saves them in temp
    public async getEntries() {
        let client = await this.getClient();
        try {
            await client.connect();
            const db_entries = client.db("lorawan_data").collection("sensor_data");
            let entries = await db_entries.find().toArray();
            entries.forEach(entrie => {
                entrie.time = new Date(entrie.time).toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
            });
            return entries;
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }

    // Updates the editable fields 
    public async updateEditableFields(_id: string, data: {}) {
        let client = await this.getClient();
        try {
            await client.connect();
            const collection = client.db("lorawan_data").collection("sensor_data");
            await collection.updateOne({ "_id": new ObjectId(_id) }, { $set: data });
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }

    // Updates a db entrie or add a new one. Triggert by TTN Uplink
    public async updateDBbyUplink(_devEUI: string, data: {}, base_data: {}) {
        let client = await this.getClient();
        try {
            // Get db entrie by given dev_eui and save it in result
            await client.connect();
            const collection = client.db("lorawan_data").collection("sensor_data");
            const result = await collection.find({ "dev_eui": _devEUI }).toArray();

            // No db entrie was found
            if (result.length == 0) {
                const insert_data = JSON.parse(JSON.stringify(data));
                const res = await collection.insertOne(insert_data);
                console.log(`Generated new entrie with ID: ${res.insertedId}`);
            } else {
                // if there is a db entry, get id from entrie and update
                const obj_id = JSON.parse(JSON.stringify(result));
                const insert_data = JSON.parse(JSON.stringify(base_data));
                await collection.updateOne({ "_id": new ObjectId(obj_id[0]._id) }, { $set: insert_data });
                console.log(`Updated entrie with ID: ${obj_id[0]._id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }
}

