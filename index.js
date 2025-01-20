const jwt = require("jsonwebtoken");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SK);

const app = express();

const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b7rwi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const carouselCollection = client.db("Zenith").collection("carousel");
    const campCollection = client.db("Zenith").collection("camps");
    const userCollection = client.db("Zenith").collection("users");
    const regCampCollection = client.db("Zenith").collection("registeredCamps");
    const transactionCollection = client
      .db("Zenith")
      .collection("transactions");
    const feedbackCollection = client.db("Zenith").collection("feedback");

    //! JWT API's

    app.post("/jwt/sign-in", (req, res) => {
      const payload = req.body;
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // Verify Token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorize access" });
      }
      const token = req.headers.authorization;
      jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "unauthorize access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verify Admin
    const verifyAdmin = async (req, res, next) => {
      const uid = req.decoded.uid;
      const user = await userCollection.findOne({ uid: uid });
      const isAdmin = user?.role === "admin";

      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // ! Camp API's

    // Camp Post secure for admin
    app.post("/camps", verifyToken, verifyAdmin, async (req, res) => {
      if (req.body.contributor !== req.decoded.uid) {
        return res
          .status(403)
          .send({ success: false, message: "Forbidden access" });
      }

      const result = await campCollection.insertOne(req.body);
      res.status(200).send(result);
    });

    app.get("/camps", async (req, res) => {
      try {
        const campsData = await campCollection
          .find()
          .sort({ postedTime: -1 })
          .toArray();
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

    // Update  single Camp
    app.patch(
      "/update-camp/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const updatedCamp = req.body;
        const updatedDoc = {
          $set: {
            ...updatedCamp,
          },
        };

        const result = await campCollection.updateOne(
          { _id: new ObjectId(id) },
          updatedDoc
        );
        res.send(result);
      }
    );

    // Delete Camp
    app.delete("/delete-camp/:id", async (req, res) => {
      const { id } = req.params;

      const result = await campCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Increase participant count
    app.patch("/participant-count/inc/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updateDoc = {
        $inc: { participantCount: 1 },
      };

      const result = await campCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });

    // Search camp
    app.get("/search", async (req, res) => {
      const searchQuery = req.query.v;
      const result = await campCollection
        .find({
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { healthcareProfessional: { $regex: searchQuery, $options: "i" } },
            { location: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    // ! Users API's

    // Admin Or not check API
    app.get("/users/admin/:uid", verifyToken, async (req, res) => {
      if (req.params.uid !== req.decoded.uid) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const user = await userCollection.findOne({ uid: req.params.uid });
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

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

    app.post("/users", verifyToken, async (req, res) => {
      const userInfo = req.body;
      if (userInfo.uid !== req.decoded.uid) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      try {
        const result = await userCollection.insertOne(userInfo);
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .send({ success: false, message: "user post on data failed" });
      }
    });

    app.get("/user/:uid", verifyToken, async (req, res) => {
      const result = await userCollection.findOne({ uid: req.params.uid });
      res.send(result);
    });

    app.patch("/user/:uid", verifyToken, async (req, res) => {
      const updateUser = {
        $set: {
          ...req.body,
        },
      };
      const result = await userCollection.updateOne(
        { uid: req.params.uid },
        updateUser,
        { upsert: true }
      );
      res.send(result);
    });

    app.post("/users/google-sign-in", async (req, res) => {
      const userInfo = req.body;
      const isUserActive = await userCollection.findOne({ uid: userInfo?.uid });
      if (isUserActive) {
        return res.send({ message: "user already in db" });
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    // ! Registered Camp API's

    app.post("/reg-camps", verifyToken, async (req, res) => {
      const regInfo = req.body;
      const result = await regCampCollection.insertOne(regInfo);
      res.send(result);
    });

    // patch payment status true for user.
    app.patch("/set-Payment-status/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updateDoc = {
        $set: { paymentStatus: true },
      };
      const result = await regCampCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);
    });

    app.patch("/feedback-status/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updateDoc = {
        $set: { feedbackStatus: true },
      };
      const result = await regCampCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc,
        { upsert: true }
      );
      res.send(result);
    });

    // patch confirm status for admin
    app.patch(
      "/set-confirm-status/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const updateDoc = {
          $set: { confirmationStatus: true },
        };
        const result = await regCampCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc
        );
        res.send(result);
      }
    );

    // Delete or Cancel any user registered camp by admin
    app.delete(
      "/delete-reg/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const result = await regCampCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      }
    );

    // User wise cancel reg camp
    app.delete("/cancel-reg/:id", verifyToken, async (req, res) => {
      const regDoc = await regCampCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (regDoc.participantUid !== req.decoded.uid) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      const { id } = req.params;
      const result = await regCampCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // all reg camp get
    app.get("/reg-camps", verifyToken, verifyAdmin, async (req, res) => {
      const result = await regCampCollection
        .find()
        .sort({ campRegTime: -1 })
        .toArray();
      res.send(result);
    });

    // User wise registered camp get
    app.get("/reg-camps/:uid", verifyToken, async (req, res) => {
      if (req.params.uid !== req.decoded.uid) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const registeredCamps = await regCampCollection
        .find({ participantUid: req.params.uid })
        .sort({ campRegTime: -1 })
        .toArray();
      res.send(registeredCamps);
    });

    // single registered camp get
    app.get("/reg-camp/:id", verifyToken, async (req, res) => {
      const result = await regCampCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // !FeedBack API's
    app.post("/feedback", verifyToken, async (req, res) => {
      const newFeedback = req.body;
      const result = await feedbackCollection.insertOne(newFeedback);
      res.send(result);
    });

    app.get("/feedback", async (req, res) => {
      const result = await feedbackCollection
        .aggregate([
          {
            $project: {
              _id: 0,
              feedbackComment: 1,
              campName: 1,
              drName: 1,
              Rate: 1,
              participantName: { $substr: ["$participantName", 0, 3] },
            },
          },
        ])
        .sort({ feedbackPostTime: -1 })
        .toArray();
      res.send(result);
    });

    // ! Transaction API's
    app.post("/transactions", verifyToken, async (req, res) => {
      const payInfo = req.body;
      const result = await transactionCollection.insertOne(payInfo);
      res.send(result);
    });

    // User Based Transactions get
    app.get("/transactions/:uid", verifyToken, async (req, res) => {
      const { uid } = req.params;

      const result = await transactionCollection
        .aggregate([
          {
            $match: { userId: uid },
          },
          {
            $addFields: {
              regId: { $convert: { input: "$regId", to: "objectId" } },
            },
          },
          {
            $lookup: {
              from: "registeredCamps",
              localField: "regId",
              foreignField: "_id",
              as: "campDetails",
            },
          },
          {
            $unwind: "$campDetails",
          },
          {
            $project: {
              trxId: 1,
              campName: 1,
              campFee: 1,
              payTime: 1,
              paymentStatus: "$campDetails.paymentStatus",
              confirmationStatus: "$campDetails.confirmationStatus",
            },
          },
        ])
        .sort({ payTime: -1 })
        .toArray();

      res.send(result);
    });

    //

    // ! Payment Intent

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      if (!price) {
        return res.send("price is 0");
      }

      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

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
