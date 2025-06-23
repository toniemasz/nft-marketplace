const fs = require("fs");
const { ethers } = require("ethers");

const getUserWallet = (username) => {
  const users = JSON.parse(fs.readFileSync("users.json"));
  const user = users[username.toLowerCase()];
  if (!user || !user.privateKey) {
    throw new Error("Nieznany użytkownik lub brak klucza");
  }

  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  return new ethers.Wallet(user.privateKey, provider);
};

module.exports = { getUserWallet };

