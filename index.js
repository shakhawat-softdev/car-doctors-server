const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken');

const test = 100;

//Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
   res.send('Doctors is Running..........')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7lxiyyz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});
const database = client.db("insertDB");
const haiku = database.collection("haiku");

const verifyJWT = (req, res, next) => {
   console.log('heatting verify JWT');
   // console.log(req.headers.authorization);
   const authorization = req.headers.authorization;
   if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorize access' })
   }
   const token = authorization.split(' ')[1]
   console.log('token inside jwt verify: ', token);
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
      if (error) {
         return res.status(403).send({ error: true, message: 'unauthorized access' })
      }
      req.decoded = decoded;
      next()
   })

}

async function run() {
   try {
      //jwt
      app.post('/jwt', async (req, res) => {
         const user = req.body;
         console.log(user);
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
         console.log(token);
         res.send({ token })
      })


      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      const serviceCollections = client.db('cardoctors').collection('services');
      const bookingCollections = client.db('cardoctors').collection('booking');

      //get all collection of data fromdb
      app.get('/services', async (req, res) => {
         const cursor = serviceCollections.find();
         const result = await cursor.toArray();
         res.send(result);
      })

      //bookings
      app.get('/bookings', verifyJWT, async (req, res) => {
         const decoded = req.decoded;
         console.log('came back after verify', decoded);

         if (decoded.email !== req.query.email) {
            return res.status(403).send({ error: 1, message: 'Forbidden Access' })
         };

         let query = {};
         if (req.query?.email) {
            query = { email: req.query.email }
         }
         const result = await bookingCollections.find(query).toArray();
         res.send(result)
      });

      //insert db data
      app.post('/bookings', async (req, res) => {
         const booking = req.body;
         // console.log(booking);
         const result = await bookingCollections.insertOne(booking)
         res.send(result)
      });

      //Upudate
      app.patch('/bokings/:id', async (req, res) => {
         const id = req.params.id;
         const filter = { _id: new ObjectId(id) }
         const updatedBooking = req.body;

         console.log(updatedBooking);

         const updateDoc = {
            $set: {
               status: updatedBooking.status
            },
         };
         const result = await bookingCollections.updateOne(filter, updateDoc);
         res.send(result)
      })

      //Delete 
      app.delete('/bookings/:id', async (req, res) => {
         const id = req.params.id;
         // console.log(id)
         const query = { _id: new ObjectId(id) };
         const result = await bookingCollections.deleteOne(query);
         res.send(result)
      });


      ////get specific data from db
      app.get('/services/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const options = {
            projection:
               { title: 1, service_id: 1, price: 1, img: 1 },
         };
         const result = await serviceCollections.findOne(query, options)
         res.send(result)
      })

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
   }
}
run().catch(console.dir);





app.listen(port, () => {
   console.log(`Doctor SERVER is Running on port: ${port}`)
});



