/*installed browserify, so i can use require in browser
const {MongoClient} = require('mongodb');
async function main(){
    const uri = "mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    try{
        await client.connect();
        await listDatabases(client);
        //await createSensorData(client,{date: new Date(), temperature: 23, humidity: 55, gateway_name: "test"});
    }catch(e){
        console.error(e);
    } finally {
        await client.close();
    }
    
}

main().catch(console.error);

async function listDatabases(client) {
    let databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(db.name));
};

async function createSensorData(client, newData){
    const result = await client.db("lorawan_data").collection("sensor_data").insertOne(newData);
    console.log(result.insertedId);
}*/ 
//# sourceMappingURL=db_connect.js.map