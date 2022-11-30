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
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
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
        const productsCollection = client.db("tukitaki").collection("products");
        const reportedItemsCollection = client.db("tukitaki").collection("reportedItems");
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
        app.get('/category/:category_name', async (req, res) => {
            const category_name = req.params.category_name;
            const products = await productsCollection.find({}).toArray();
            const filter = products.filter(product => {
                console.log(product.mobileName)
                if (product.mobileBrand.toLocaleLowerCase() === category_name.toLocaleLowerCase()) {
                    return product;
                }
            })
            console.log(filter)
            res.send(filter)
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
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
            
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const seller = await usersCollection.findOne(query);
            
            res.send({ isSeller: seller?.role === 'seller', seller});
        })
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const buyer = await usersCollection.findOne(query);
            res.send({ isBuyer: buyer?.role === 'buyer', buyer });
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
        app.get('/users/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const user = await usersCollection.findOne(filter);
           
            res.send(user);
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
        app.put("/users/sellers/verify/:id", async (req, res) => {
            const id = req.params.id;
            const verified = req.body.verified
            const query = { _id: ObjectId(id) }
            
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: verified
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        })
        app.put("/users/sellers/unverify/:id", async (req, res) => {
            const id = req.params.id;
            const verified = req.body.verified
            
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: verified
                }
            }
           
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result);
        })
        app.post('/products', async (req, res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        app.get('/products/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            console.log(email, query)
            const products = await productsCollection.find({}).toArray();
            
            const filter = products.filter(product => {
                console.log(product.sellerEmail)
                if (product.sellerEmail === query.email) {
                    return product;
                }
            })
            res.send(filter)
        })
        app.get('/products/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            console.log(id, filter)
            const result = await productsCollection.findOne(filter);
           
            res.send(result);
        })
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(product);
            res.send(result);

        })
        app.post('/reported-items', async (req, res) => {
            const product = req.body;
            const result = await reportedItemsCollection.insertOne(product);
            res.send(result);
        })
        app.get('/reported-items', async (req, res) => {
            
            const result = await reportedItemsCollection.find({}).toArray();
            res.send(result);
        })
        app.delete('/reported-items/:id', async (req, res) => {
            const id = req.params.id;
            const product = { _id: ObjectId(id) };
            const result = await reportedItemsCollection.deleteOne(product);
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