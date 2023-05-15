import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

export class DB {
    /** Returns a MongoClient Object. */
    public async get_client() {
        return new MongoClient(`mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority`);
    }

    /** Returns the DB entries. */
    public async get_entries() {
        let client = await this.get_client();
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

    /** Returns the DB entries. */
    public async get_entrie_by_field(data: {}) {
        let client = await this.get_client();
        try {
            await client.connect();
            const db_entries = client.db("lorawan_data").collection("sensor_data");
            console.log("field: ",data);
            let entrie = await db_entries.findOne({dev_eui:data});
            if (entrie) {
                entrie.time = new Date(entrie.time).toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
            }
            return entrie;
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    }

    /** Updates the user input fields. */
    public async update_editable_fields(_id: string, data: {}) {
        let client = await this.get_client();
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

    /** Updates a db entry or add a new one. */
    public async update_db_by_uplink(_devEUI: string, data: {}, base_data: {}) {
        let client = await this.get_client();
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

