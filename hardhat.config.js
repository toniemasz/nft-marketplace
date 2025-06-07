require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();


// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
// };


// module.exports = {
//   solidity: "0.8.28",
//   networks: {
//     localhost: {
//       url: process.env.RPC_URL,
//       accounts: [process.env.PRIVATE_KEY],
//     },
//   },
// };

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};