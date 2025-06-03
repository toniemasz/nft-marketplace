const express = require("express");
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



router.get("/user/balance/:address", getUserBalance);

module.exports = router;
