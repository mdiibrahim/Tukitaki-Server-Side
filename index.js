const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@tukitaki.f0fllei.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            req.decoded = decoded;
            next();
        })
    }
    return res.status(401).send('unauthorized access');



}


async function run() {
    try {
        const categoriesCollection = client.db("tukitaki").collection("categories");
        const usersCollection = client.db("tukitaki").collection("users");
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        app.get('/category', async (req, res) => {

            const categories = await categoriesCollection.find({}).toArray();
            res.send(categories);
        });
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const categories = await categoriesCollection.find({}).toArray();
            res.send(categories);
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (!user) {
                res.status(403).send({ accessToken: null })
            }
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            return res.send({ accessToken: token });

        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const copiedUser = await usersCollection.findOne(user);
            if (!copiedUser) {

                res.send(await usersCollection.insertOne(user));
            }
            res.status(200).send({ acknowledged: 'successfull' })
        })
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' });
        })
        // app.get('/users', async (req, res) => {
        //     const user = req.body;
        //     res.send(await usersCollection.insertOne(user));
        // })
        app.get('/users/sellers', async (req, res) => {
            const users = await usersCollection.find({}).toArray();
            const filter = users.filter(user => {
                if (user.role === 'seller') {
                    return user;
                }
            })
            res.send(filter)
        })
        app.get('/users/buyers', async (req, res) => {
            const users = await usersCollection.find({}).toArray();
            const filter = users.filter(user => {
                if (user.role === 'buyer') {
                    return user;
                }
            })
            res.send(filter)
        })
        app.delete('/users/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/users/buyers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })


    } finally {

    }
}
run().catch(console.log);
app.get('/', async (req, res) => {
    res.send('Tukitaki-টুকিটাকি server is running......');
})

app.listen(port, () => {
    console.log(`Tukitaki-টুকিটাকি is running on port ${port}`)
})