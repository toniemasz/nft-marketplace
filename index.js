const fs = require('fs');
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

// Contract addresses 
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

// Funkcja generująca JSON z metadanymi
function generateMetadata(filename) {
  const metadata = {
    name: `NFT ${filename}`, // możesz spersonalizować nazwę
    description: "Opis mojego NFT",
    image: `http://localhost:3000/${filename}`
  };

  // Zmieniamy rozszerzenie pliku na .json
  const jsonFilename = filename.replace(path.extname(filename), ".json");
  const jsonPath = path.join(__dirname, "uploads", jsonFilename);

  // Zapisujemy plik JSON
  fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

  return `http://localhost:3000/${jsonFilename}`;
}

// Upload file and mint NFT (z generowaniem JSON)
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
    const metadataUrl = generateMetadata(req.file.filename);

    res.json({
      success: true,
      imageUrl,
      metadataUrl, // link do JSONa z metadanymi
      message: "File uploaded successfully and metadata generated."
    });
  } catch (error) {
    console.error("Upload error:", error);
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

// New endpoint to handle resell requests 
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


    res.json({
      success: true,
      message: "Resell request validated. Please complete the transaction in your wallet."
    });

  } catch (error) {
    console.error("Resell validation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's owned NFTs 
app.get("/owned/:userAddress", async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!userAddress) {
      return res.status(400).json({ 
        success: false, 
        error: "User address is required" 
      });
    }


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

//  Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("NFT Contract:", NFT_ADDRESS);
  console.log("Marketplace Contract:", MARKETPLACE_ADDRESS);
  console.log(" Resell feature enabled");
});
