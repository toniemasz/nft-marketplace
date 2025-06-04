const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

// Upewnij się, że katalog uploads istnieje
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const usersFile = "./users.json";

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

// 🔐 Logowanie lub rejestracja użytkownika
app.post("/login", (req, res) => {
  const { userId } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  let user = users.users.find(u => u.id === userId);

  if (!user) {
    const newUser = {
      id: userId,
      address: "0x" + crypto.randomBytes(20).toString("hex"),
      privateKey: "0x" + crypto.randomBytes(32).toString("hex"),
      balance: 10000,
      ownedNFTs: []
    };
    users.users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return res.json({ success: true, user: newUser });
  } else {
    return res.json({ success: true, user });
  }
});

// 📤 Upload NFT
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const price = req.body.price;
    const filePath = "/uploads/" + req.file.filename;
    const tx = await contract.createItem(`http://localhost:3000${filePath}`, ethers.parseEther(price));
    await tx.wait();
    res.json({ success: true, imageUrl: `http://localhost:3000${filePath}` });
  } catch (err) {
    console.error(err);
    const message = err.message || "Błąd połączenia z blockchainem";
    res.status(500).json({ success: false, error: message });
  }
});

// 📦 Wszystkie NFT
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

// 💸 Kup NFT
app.post("/buy", async (req, res) => {
  const { id, userId } = req.body;

  try {
    const item = await contract.getItem(id);

    if (item.sold) {
      return res.status(400).json({ success: false, error: "NFT już zostało sprzedane" });
    }

    const users = JSON.parse(fs.readFileSync(usersFile));
    const buyer = users.users.find(u => u.id === userId);
    const seller = users.users.find(u => u.address.toLowerCase() === item.owner.toLowerCase());

    const price = Number(ethers.formatEther(item.price));

    if (!buyer || buyer.balance < price) {
      return res.status(400).json({ success: false, error: "Brak środków" });
    }

    // Transakcja blockchain
    const tx = await contract.purchaseItem(id, { value: item.price });
    await tx.wait();

    // 💰 Aktualizacja sald
    buyer.balance -= price;
    if (seller) {
      seller.balance += price;

      // ❌ Usuń NFT z ownedNFTs sprzedającego
      seller.ownedNFTs = seller.ownedNFTs.filter(nftId => nftId !== Number(id));
    }

    // ✅ Dodaj NFT kupującemu
    if (!buyer.ownedNFTs.includes(Number(id))) {
      buyer.ownedNFTs.push(Number(id));
    }

    // 💾 Zapisz zmiany
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});





// 🎒 NFT należące do backendowego portfela
app.get("/owned", async (req, res) => {
  const userId = req.query.userId;

  try {
    const users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "Użytkownik nie znaleziony" });
    }

    const itemCount = await contract.itemCount();
    const owned = [];

    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.getItem(i);
      if (user.ownedNFTs.includes(Number(item.id))) {
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

app.post("/resell", async (req, res) => {
  const { userId, id, price } = req.body;

  try {
    const users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.users.find(u => u.id === userId);

    if (!user || !user.ownedNFTs.includes(Number(id))) {
      return res.status(403).json({ success: false, error: "Brak dostępu" });
    }

    const tx = await contract.resellItem(id, ethers.parseEther(price));
    await tx.wait();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧾 Historia zakupów
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

    enriched.sort((a, b) => b.timestamp - a.timestamp);
    res.json({ success: true, history: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "Użytkownik nie znaleziony" });
    }

    // Pobieramy NFT z kontraktu
    const owned = [];
    const itemCount = await contract.itemCount();

    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.getItem(i);
      if (user.ownedNFTs.includes(Number(item.id))) {
        owned.push({
          id: Number(item.id),
          imageUrl: item.imageUrl,
          price: ethers.formatEther(item.price),
          sold: item.sold
        });
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        address: user.address,
        balance: user.balance,
        ownedNFTs: owned
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ▶️ Start serwera
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
