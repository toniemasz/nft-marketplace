const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log("Wallet address:", wallet.address);

// Wczytaj ABI kontraktów
const nftAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "../abi/NFT.json")));
const marketplaceAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "../abi/NFTMarketplace.json")));

const nftContract = new ethers.Contract(process.env.NFT_ADDRESS, nftAbi.abi, wallet);
const marketplaceContract = new ethers.Contract(process.env.MARKETPLACE_ADDRESS, marketplaceAbi.abi, wallet);

module.exports = {
  provider,
  wallet,
  nftContract,
  marketplaceContract,
  nftAddress: process.env.NFT_ADDRESS,
  marketplaceAddress: process.env.MARKETPLACE_ADDRESS
};
