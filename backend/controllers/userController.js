const { provider } = require("../utils/blockchain");
const { ethers } = require("ethers");

const getUserBalance = async (req, res) => {
  try {
    const address = req.params.address;
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.formatEther(balance);
    res.json({ balance: ethBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserBalance
};
