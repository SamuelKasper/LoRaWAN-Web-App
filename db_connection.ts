import { MongoClient } from "mongodb";

let connection: MongoClient;
let db;

async function connectToDB(){
    const connectionString = process.env.DATABASE_URL || "";
    const client = new MongoClient(connectionString);
    
    try {
      connection = await client.connect();
    } catch(e) {
      console.error(e);
    }
    db = connection.db("lorawan_data");
}

export default db;