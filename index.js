
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.static("uploads"));
app.use(express.static("public")); // Serve HTML files

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(express.json());

// Contract addresses (update these with your deployed addresses)
const contractAddresses = require('./contract-addresses.json');
const NFT_ADDRESS = contractAddresses.MyNFT;
const MARKETPLACE_ADDRESS = contractAddresses.NFTMarketplace;

// Updated ABIs with new resell functions
const NFT_ABI = [
  "function mint(string memory _tokenURI) public",
  "function nextTokenId() public view returns (uint)",
  "function ownerOf(uint tokenId) public view returns (address)",
  "function tokenURI(uint tokenId) public view returns (string)",
  "function approve(address to, uint tokenId) public"
];

const MARKETPLACE_ABI = [
  "function listNFT(address nftContract, uint tokenId, uint _price) public",
  "function buyNFT(uint _listingId) public payable",
  "function resellNFT(uint _listingId, uint _newPrice) public",
  "function getAllListings() public view returns (tuple(address seller, address nftContract, uint tokenId, uint price, bool sold)[])",
  "function getListing(uint _id) public view returns (tuple(address seller, address nftContract, uint tokenId, uint price, bool sold))",
  "function getMyPurchases() public view returns (uint[])",
  "function getMyOwnedNFTs() public view returns (uint[])",
  "function checkIsListed(address nftContract, uint tokenId) public view returns (bool)",
  "event NFTListed(uint listingId, address seller, address nftContract, uint tokenId, uint price)",
  "event NFTSold(uint listingId, address buyer)",
  "event NFTRelisted(uint listingId, address seller, uint newPrice)"
];

//  Multer - save to uploads directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});

const upload = multer({ storage });

//  Upload file and mint NFT
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const { price } = req.body;
    if (!price) {
      return res.status(400).json({ success: false, error: "Price is required" });
    }

    const imageUrl = `http://localhost:3000/${req.file.filename}`;
   
    res.json({
      success: true,
      imageUrl,
      message: "File uploaded successfully. Use the frontend to mint NFT."
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all NFTs from marketplace
app.get("/nfts", async (req, res) => {
  try {
    // This is a simplified version - in a real app you'd query the blockchain
    // For now, return empty array - the frontend will handle blockchain calls
    res.json({ nfts: [] });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get contract addresses
app.get("/addresses", (req, res) => {
  res.json({
    nftAddress: NFT_ADDRESS,
    marketplaceAddress: MARKETPLACE_ADDRESS
  });
});

// New endpoint to handle resell requests (if you want to add server-side validation)
app.post("/resell", async (req, res) => {
  try {
    const { userId, listingId, newPrice } = req.body;
    
    if (!userId || !listingId || !newPrice) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required parameters: userId, listingId, newPrice" 
      });
    }

    if (parseFloat(newPrice) <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Price must be greater than 0" 
      });
    }

    // In a real application, you might want to add additional validation here
    // For now, we'll let the smart contract handle the validation
    res.json({
      success: true,
      message: "Resell request validated. Please complete the transaction in your wallet."
    });

  } catch (error) {
    console.error("Resell validation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's owned NFTs (server-side helper - optional)
app.get("/owned/:userAddress", async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!userAddress) {
      return res.status(400).json({ 
        success: false, 
        error: "User address is required" 
      });
    }

    // This would typically involve querying the blockchain
    // For now, return a success response - the frontend handles blockchain calls
    res.json({
      success: true,
      message: "Use the frontend to load owned NFTs directly from the blockchain"
    });

  } catch (error) {
    console.error("Error fetching owned NFTs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    contracts: {
      nft: NFT_ADDRESS,
      marketplace: MARKETPLACE_ADDRESS
    }
  });
});

// ▶️ Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("NFT Contract:", NFT_ADDRESS);
  console.log("Marketplace Contract:", MARKETPLACE_ADDRESS);
  console.log(" Resell feature enabled");
});