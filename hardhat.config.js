require("@chainlink/env-enc").config();
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("./task");

const PRIVATE_KEY = process.env.ACCOUNT1_PRIVATE
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const AMOY_RPC_URL = process.env.AMOY_RPC_URL

module.exports = {
  defaultNetwork: "hardhat", // hardhat sepolia

  solidity:{
    compilers: [
      {
        version: "0.8.27"
      },
      {
        version: "0.8.19"
      }
    ]
  },

  namedAccounts: {
    account1: {
      default: 0
    }
  },

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 6,
      companionNetworks: {
        destChain: "amoy"
      }
    },
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      blockConfirmations: 6,
      companionNetworks: {
        destChain: "sepolia"
      }
    }
  },

};