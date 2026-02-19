const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { MongoClient } = require("mongodb");
const fs = require("fs");

const app = express();

/* ---------- IMPORTANT FIXES ---------- */
// allow large requests (image upload fix)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// allow Netlify frontend to call backend
app.use(cors({
  origin: "*",
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type"]
}));

// serve uploaded images
app.use("/uploads", express.static("uploads"));

/* ---------- CREATE UPLOADS FOLDER (Render Fix) ---------- */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ---------- FILE UPLOAD SETUP ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

// allow up to 5MB images
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

// health check
app.get("/", (req,res)=>{
  res.send("API Running");
});

// upload report
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

// fetch reports
app.get("/reports", async (req,res)=>{
  try{
    const data = await db.collection("reports")
      .find()
      .sort({createdAt:-1})
      .toArray();

    res.json(data);
  }catch(err){
    res.status(500).json({error:"Failed to fetch"});
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("Server running on port " + PORT));
