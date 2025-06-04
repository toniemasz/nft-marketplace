const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const nftRoutes = require("./routes/nftRoutes");
const FRONTEND_DIR = path.join(__dirname, "../frontend");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(FRONTEND_DIR)); // <-- nowość

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "backend/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

app.use("/api", upload.single("image"), nftRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Backend działa na http://localhost:${PORT}`);
});
