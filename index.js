const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
app.use(express.json());
app.use(cors());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@tukitaki.f0fllei.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

app.get('/', (req, res) => {
    res.send('Tukitaki-টুকিটাকি server is running......');
})

app.listen(port, () => {
  console.log(`Tukitaki-টুকিটাকি is running on port ${port}`)
})