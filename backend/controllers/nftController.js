const fs = require("fs");
const { ethers } = require("ethers");
const {
  nftContract,
  marketplaceContract,
  nftAddress,
  marketplaceAddress
} = require("../utils/blockchain");

const { getUserWallet } = require("../utils/getUserWallet");

// ✅ Mint NFT
const mintNFT = async (req, res) => {
  try {
    const { name, description, username } = req.body;
    const userWallet = getUserWallet(username);
    const userAddress = userWallet.address;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Niepoprawny adres Ethereum" });
    }

    const connectedNFT = nftContract.connect(userWallet);
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const metadata = { name, description, image: imageUrl };
    const tokenURI = JSON.stringify(metadata);

    const tx = await connectedNFT.mintNFT(userAddress, tokenURI);
    const receipt = await tx.wait();
    const tokenId = receipt.logs[0].args[2].toString();

    res.json({ success: true, tokenId, imageUrl });
  } catch (err) {
    console.error("❌ Błąd mintowania NFT:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Wystaw NFT
const listNFT = async (req, res) => {
  try {
    const { tokenId, price, username } = req.body;
    const userWallet = getUserWallet(username);
    const userAddress = userWallet.address;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Niepoprawny adres Ethereum" });
    }

    const weiPrice = ethers.parseEther(price);
    const connectedNFT = nftContract.connect(userWallet);
    const connectedMarketplace = marketplaceContract.connect(userWallet);

    await connectedNFT.approve(marketplaceAddress, tokenId);
    const tx = await connectedMarketplace.listItem(nftAddress, tokenId, weiPrice);
    await tx.wait();

    res.json({ success: true, tokenId, price });
  } catch (err) {
    console.error("❌ Błąd wystawiania NFT:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Kup NFT
const buyNFT = async (req, res) => {
  try {
    const { listingId, username } = req.body;
    const userWallet = getUserWallet(username);
    const userAddress = userWallet.address;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Niepoprawny adres Ethereum" });
    }

    const listing = await marketplaceContract.getListing(listingId);
    const connectedMarketplace = marketplaceContract.connect(userWallet);

    const tx = await connectedMarketplace.buyItem(listingId, {
      value: listing.price
    });
    await tx.wait();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd kupowania NFT:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Lista NFT na sprzedaż (z nazwą i obrazkiem)
const getAllListings = async (req, res) => {
  try {
    const total = await marketplaceContract.getTotalListings();
    const items = [];

    for (let i = 1; i <= total; i++) {
      const listing = await marketplaceContract.getListing(i);
      if (!listing.sold) {
        const tokenURI = await nftContract.tokenURI(listing.tokenId);
        const metadata = JSON.parse(tokenURI);

        items.push({
          id: i,
          tokenId: listing.tokenId.toString(),
          nft: listing.nft,
          seller: listing.seller,
          price: ethers.formatEther(listing.price),
          image: metadata.image,
          name: metadata.name
        });
      }
    }

    res.json({ items });
  } catch (err) {
    console.error("❌ Błąd pobierania ofert:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ NFT użytkownika
const getUserNFTs = async (req, res) => {
  try {
    const { userAddress } = req.params;

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Niepoprawny adres Ethereum" });
    }

    const balance = await nftContract.balanceOf(userAddress);
    const nfts = [];

    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
      const tokenUri = await nftContract.tokenURI(tokenId);

      let metadata;
      try {
        metadata = JSON.parse(tokenUri);
      } catch (e) {
        metadata = { name: "Nieznany", description: "", image: "" };
      }

      nfts.push({
        tokenId: tokenId.toString(),
        ...metadata
      });
    }

    res.json({ nfts });
  } catch (err) {
    console.error("❌ Błąd pobierania NFT użytkownika:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  mintNFT,
  listNFT,
  buyNFT,
  getAllListings,
  getUserNFTs
};
