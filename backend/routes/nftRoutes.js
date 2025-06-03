const express = require("express");
const fs = require("fs"); // DODANE!
const router = express.Router();

const { getUserBalance } = require("../controllers/userController");
const {
  mintNFT,
  listNFT,
  buyNFT,
  getAllListings,
  getUserNFTs
} = require("../controllers/nftController");

// Mint nowego NFT
router.post("/mint", mintNFT);

// Wystaw NFT na marketplace
router.post("/list", listNFT);

// Kup NFT
router.post("/buy", buyNFT);

// Pobierz wszystkie wystawione NFT
router.get("/marketplace", getAllListings);

// Pobierz NFT użytkownika
router.get("/wallet/:userAddress", getUserNFTs);

// Balans użytkownika
router.get("/user/balance/:address", getUserBalance);

// ✅ Nowa trasa – adres użytkownika na podstawie username
router.get("/user/address/:username", (req, res) => {
  const users = JSON.parse(fs.readFileSync("users.json"));
  const user = users[req.params.username.toLowerCase()];
  if (!user) {
    return res.status(404).json({ error: "Nie znaleziono użytkownika" });
  }
  res.json({ address: user.address });
});

module.exports = router;
