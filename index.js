require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//Middleware 
app.use(cors());
app.use(express.json());


// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjd5x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    const reviewsCollection = client.db('gameReviewsDB').collection('reviews');

    const userCollection = client.db('gameReviewsDB').collection('users');
    const watchListItemCollection = client.db('gameReviewsDB').collection('watchList');

    ////insert  new review part
    app.post("/reviews", async (req, res) => {
      try {
        const review = req.body;
        const result = await reviewsCollection.insertOne(review);
        res.status(201).json({ success: true, message: "Review added!", result });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add review." });
      }
    });

    //Show all review data
    app.get("/reviews", async (req, res) => {
      try {
        const reviews = await client.db('gameReviewsDB').collection('reviews').find().toArray();
        res.json({ success: true, data: reviews });
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reviews." });
      }
    });


    //single review details 
    app.get("/review/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const review = await client
          .db("gameReviewsDB")
          .collection("reviews")
          .findOne({ _id: new ObjectId(id) });

        if (review) {
          res.json({ success: true, data: review });
        } else {
          res.status(404).json({ success: false, message: "Review not found." });
        }
      } catch (error) {
        console.error("Error fetching review:", error);
        res.status(500).json({ success: false, message: "Failed to fetch review." });
      }
    });


    //delete reviews

    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await reviewsCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.send({ success: true, message: "Review deleted successfully!" });
      } else {
        res.send({ success: false, message: "Failed to delete the review." });
      }
    });

    //update Review 
    app.put("/review/:id", async (req, res) => {
      const id = req.params.id;
      const updatedReview = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          gameTitle: updatedReview.gameTitle,
          reviewDescription: updatedReview.reviewDescription,
          rating: updatedReview.rating,
          genre: updatedReview.genre,
        },
      };

      const result = await reviewsCollection.updateOne(query, updateDoc);
      if (result.modifiedCount === 1) {
        res.send({ success: true, message: "Review updated successfully!" });
      } else {
        res.send({ success: false, message: "Failed to update the review." });
      }
    });



    //users related API's
    //insert user 
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      console.log("new user ", newUser);
      const result = await userCollection.insertOne(req.body);
      res.send(result);
    })

    //log in user 
    app.patch('/users', async (req, res) => {
      const email = req.body.email;
      const filter = { email };
      const updateDoc = {
        $set: {
          lastSignInTime: req.body?.lastSignInTime
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    //users review or my review
    app.get('/myReviews', async (req, res) => {
      const { email } = req.query; // Get email from query params
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }
      try {
        const reviews = await reviewsCollection.find({ userEmail: email }).toArray();
        res.status(200).json({ success: true, data: reviews });
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reviews" });
      }
    });



    app.get("/highest-rated-games", async (req, res) => {
      try {
        const highestRatedGames = await reviewsCollection
          .find({})
          .sort({ rating: -1 }) // Sort by the `rating` field in descending order
          .limit(6) // Limit the result to 6 items
          .toArray();

        res.send({ success: true, data: highestRatedGames });
      } catch (error) {
        console.error("Error fetching highest-rated games:", error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });



    //users watchList 
    app.post("/watchList", async (req, res) => {
      try {
        const watchListItem = req.body; // Contains review details + user info
        const result = await watchListItemCollection.insertOne(watchListItem);

        res.status(201).json({ success: true, message: "Added to watchList!", result });
      } catch (error) {
        console.error("Error adding to watchList:", error);
        res.status(500).json({ success: false, message: "Failed to add to watchList." });
      }
    });


    app.get('/watchList', async (req, res) => {
      const { email } = req.query; // Get email from query params
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }
      try {
        const reviews = await watchListItemCollection.find({ userEmail: email }).toArray();
        res.status(200).json({ success: true, data: reviews });
      } catch (error) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({ success: false, message: "Failed to fetch reviews" });
      }
    });

    //Show all users
    app.get("/users", async (req, res) => {
      try {
        const users = await client.db('gameReviewsDB').collection('users').find().toArray();
        res.json({ success: true, data: users });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users." });
      }
    });




  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Game review applications is running')
})

app.listen(port, () => {
  console.log(`game server is running on port: ${port}`)
})