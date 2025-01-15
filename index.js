const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();

const port = process.env.PORT;

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

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
    const userCollection = client.db("Zenith").collection("users");

    //! JWT API's

    app.post("/jwt/sign-in", (req, res) => {
      const payload = req.body;
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .cookie("token", token, { httpOnly: true, secure: false })
        .send({ success: true, message: "token send success to cookie" });
    });

    app.post("/jwt/sign-out", (req, res) => {
      res
        .clearCookie("token", { httpOnly: true, secure: false })
        .send({ success: true, message: "clear from cookie success" });
    });

    // ! Token Verify
    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;

      if (!token) {
        return res
          .status(401)
          .send({ message: "unauthorize access", status: 401 });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .send({ message: "unauthorize access", status: 401 });
        }
        req.decoded = decoded;
        next();
      });
    };

    // ! Admin Verify
    const verifyAdmin = async (req, res, next) => {
      const uid = req.decoded.uid;

      const user = await userCollection.findOne({ uid: uid });

      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      next();
    };

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

    // ! Users API's

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const usersData = await userCollection.find().toArray();
        res.status(200).json(usersData);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "usersData get failed" });
      }
    });

    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      try {
        const result = await userCollection.insertOne(userInfo);
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "user post on data failed" });
      }
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
