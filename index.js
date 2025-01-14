const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();

const port = process.env.PORT;

console.log(process.env.PORT);

app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b7rwi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //

    //

    const campCollection = client.db("Zenith").collection("camps");

    // ! Camp API's

    app.get("/camps", async (req, res) => {
      try {
        const campsData = await campCollection.find().toArray();
        res.status(200).json(campsData);
      } catch (error) {
        console.log(`Error fetching all camps data`, error);
        res.status(500).json({
          success: false,
          message: " an error occurred while fetching all camps data",
        });
      }
    });

    // get popular camps
    app.get("/camps/popular", async (req, res) => {
      try {
        const popularCampsData = await campCollection
          .find()
          .sort({ participantCount: -1 })
          .limit(4)
          .toArray();
        res.status(200).json({
          success: true,
          data: popularCampsData,
        });
      } catch (error) {
        console.log(`Error fetching popular camps`, error);
        res.status(500).json({
          success: false,
          message: "An error occurred while fetching popular camps",
        });
      }
    });

    // Get single camp details
    app.get("/camps/:id", async (req, res) => {
      const { id } = req.params;
      const campData = await campCollection.findOne({ _id: new ObjectId(id) });
      res.send(campData);
    });
    //

    //

    //

    const carouselCollection = client.db("Zenith").collection("carousel");

    // ! Carousel API's
    app.get("/home/banner/carousel", async (req, res) => {
      const carouselData = await carouselCollection.find().toArray();
      res.send(carouselData);
    });
  } finally {
    // For finally do something
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server running yo hu");
});

app.listen(port, () => {
  console.log(`PORT RUNNING ON ${port}`);
});
