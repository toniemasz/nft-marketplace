const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying contracts...");

  // Deploy MyNFT contract
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy();
  await nft.waitForDeployment();
  
  console.log("MyNFT deployed to:", await nft.getAddress());

  // Deploy NFTMarketplace contract
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const market = await Marketplace.deploy();
  await market.waitForDeployment();
  
  console.log("Marketplace deployed to:", await market.getAddress());

  // Save addresses to a file for backend use
  const addresses = {
    MyNFT: await nft.getAddress(),
    NFTMarketplace: await market.getAddress()
  };
  
  fs.writeFileSync('contract-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("Contract addresses saved to contract-addresses.json");
  
  console.log("\n=== Deployment Summary ===");
  console.log("MyNFT:", await nft.getAddress());
  console.log("NFTMarketplace:", await market.getAddress());
  console.log("Addresses saved to: contract-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});