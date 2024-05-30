const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://prathish:anju123@prathishanjani.lbverpn.mongodb.net/?retryWrites=true&w=majority&appName=prathishanjani";
let database;
async function connect(){
    const client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
      await client.connect();
database = client.db('Chat-Application');
}

function getDb(){
    if(!database) throw {message: "Database not connected!"};
    return database;
}

module.exports = {
    connectToDatabase : connect,
    getDb : getDb
};




