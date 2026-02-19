const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ---------- FILE UPLOAD ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* ---------- DATABASE ---------- */
const uri = "mongodb+srv://irfansheriffh_db_user:aA5adYKM5MXiY6jS@cluster0.oab6udn.mongodb.net/lostfound?retryWrites=true&w=majority";

const client = new MongoClient(uri);
let db;

async function connectDB(){
  await client.connect();
  db = client.db("lostfound");
  console.log("MongoDB Connected");
}
connectDB();

/* ---------- ROUTES ---------- */

// test route
app.get("/", (req,res)=>{
  res.send("API Running");
});

// save report
app.post("/report", upload.single("photo"), async (req,res)=>{
  try{
    const report = {
      item:req.body.item,
      description:req.body.description,
      location:req.body.location,
      finderName:req.body.name,
      phone:req.body.phone,
      email:req.body.email,
      image:req.file.filename,
      createdAt:new Date()
    };

    await db.collection("reports").insertOne(report);
    res.json({status:"success"});
  }catch(err){
    console.log(err);
    res.status(500).json({error:"Upload failed"});
  }
});

// get all reports
app.get("/reports", async (req,res)=>{
  const data = await db.collection("reports")
  .find()
  .sort({createdAt:-1})
  .toArray();

  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("Server running on port " + PORT));

