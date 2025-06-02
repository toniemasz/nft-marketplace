const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

// Multer - zapis do katalogu uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// Ethers + kontrakt
const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const abi = require("./abi.json");
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// Upload i rejestracja NFT
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const price = req.body.price;
    const filePath = "/uploads/" + req.file.filename; // dostępny przez Express

    const tx = await contract.createItem(`http://localhost:3000${filePath}`, ethers.parseEther(price));
    await tx.wait();

    res.json({ success: true, imageUrl: `http://localhost:3000${filePath}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/nfts", async (req, res) => {
  try {
    const itemCount = await contract.itemCount();
    const nfts = [];

    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.getItem(i);
      nfts.push({
        id: Number(item.id),
        imageUrl: item.imageUrl,
        price: ethers.formatEther(item.price),
        owner: item.owner,
        sold: item.sold
      });
    }

    res.json({ success: true, nfts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/buy", express.json(), async (req, res) => {
  const { id } = req.body;

  try {
    const item = await contract.getItem(id);

    if (item.sold) {
      return res.status(400).json({ success: false, error: "NFT już zostało sprzedane" });
    }

    const tx = await contract.purchaseItem(id, { value: item.price });
    await tx.wait();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/owned", async (req, res) => {
  try {
    const itemCount = await contract.itemCount();
    const myAddress = await wallet.getAddress();
    const owned = [];

    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.getItem(i);
      if (item.owner.toLowerCase() === myAddress.toLowerCase()) {
        owned.push({
          id: Number(item.id),
          imageUrl: item.imageUrl,
          price: ethers.formatEther(item.price),
          sold: item.sold
        });
      }
    }

    res.json({ success: true, owned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/history", async (req, res) => {
  try {
    const filter = contract.filters.ItemPurchased();
    const events = await contract.queryFilter(filter, 0, "latest");

    const enriched = await Promise.all(events.map(async (e) => {
      const item = await contract.getItem(e.args.id);
      return {
        id: Number(e.args.id),
        imageUrl: item.imageUrl,
        buyer: e.args.newOwner,
        price: ethers.formatEther(item.price),
        timestamp: (await e.getBlock()).timestamp
      };
    }));

    // sortujemy od najnowszego
    enriched.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ success: true, history: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start serwera
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
