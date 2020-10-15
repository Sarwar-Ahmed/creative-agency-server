const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1zxmx.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;



const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('service'));
app.use(fileUpload());

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
  const adminCollection = client.db("creativeAgency").collection("admin");

  
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

    app.post('/addOrder', (req, res) => {
        const image = req.files.image;
        const name = req.body.name;
        const email = req.body.email;
        const project = req.body.project;
        const details = req.body.details;
        const price = req.body.price;
        const status = req.body.status;
        const filePath = `${__dirname}/order/${image.name}`;
        image.mv(filePath, err => {
            if(err){
                console.log(err);
                res.status(500).send({msg: 'Failed to upload Image'});
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            const image = {
                contentType: req.files.image.mimetype,
                size: req.files.image.size,
                img: Buffer.from(encImg, 'base64')
            };
            userOrderCollection.insertOne({name, email, project, details, price, status, image})
            .then(result => {
                fs.remove(filePath, error => {
                    if(error) {
                        console.log(error);
                        res.status(500).send({msg: 'Failed to upload Image'});
                    }
                    res.send(result.insertedCount > 0);
                })
            })
        })
        
    })

    app.post('/addService', (req, res) => {
        const image = req.files.image;
        const title = req.body.title;
        const description = req.body.description;
        const filePath = `${__dirname}/service/${image.name}`;
        image.mv(filePath, err => {
            if(err){
                console.log(err);
                res.status(500).send({msg: 'Failed to upload Image'});
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            const image = {
                contentType: req.files.image.mimetype,
                size: req.files.image.size,
                img: Buffer.from(encImg, 'base64')
            };
            servicesCollection.insertOne({title, description, image})
            .then(result => {
                fs.remove(filePath, error => {
                    if(error) {
                        console.log(error);
                        res.status(500).send({msg: 'Failed to upload Image'});
                    }
                    res.send(result.insertedCount > 0);
                })
            })
        })
        
    })

    app.post('/addAdmin', (req, res) => {
        const events = req.body;
        adminCollection.insertOne(events)
            .then(result => {
                res.send(result.insertedCount);
            })
    })
    app.get('/admins', (req, res) => {
        adminCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
        })
});


app.get('/', (req, res) => {
    res.send("Hello Server");
})

app.listen(process.env.PORT || port)