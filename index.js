const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1zxmx.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const app = express();
app.use(bodyParser.json());
app.use(cors());

const admin = require('firebase-admin');

const serviceAccount = require("./config/creative-agency-by-sarwar-firebase-adminsdk-offfh-05edaf557d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creative-agency-by-sarwar.firebaseio.com"
});

const port = 5000;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const servicesCollection = client.db("creativeAgency").collection("services");
  const feedbackCollection = client.db("creativeAgency").collection("feedback");
  const userOrderCollection = client.db("creativeAgency").collection("userOrder");

  
    app.get('/services', (req, res) => {
    servicesCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
    })


    app.get('/feedback', (req, res) => {
    feedbackCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
    })

    app.post('/addUserOrder', (req, res) => {
        const events = req.body;
        userOrderCollection.insertOne(events)
            .then(result => {
                res.send(result.insertedCount);
            })
    })

    app.get('/userOrder', (req, res) => {
        
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        userOrderCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send('Unauthorized access');
                    }
                    // ...
                }).catch(function (error) {
                    res.status(401).send('Unauthorized access');
                });
        }
        else{
            res.status(401).send('Unauthorized access');
        }
    })

    app.post('/addReview', (req, res) => {
        const events = req.body;
        feedbackCollection.insertOne(events)
            .then(result => {
                res.send(result.insertedCount);
            })
    })

    app.get('/orders', (req, res) => {
        userOrderCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
        })
});


app.get('/', (req, res) => {
    res.send("Hello Server");
})

app.listen(process.env.PORT || port)