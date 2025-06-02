const { network, ethers } = require("hardhat");
const { DEV_NETWORK_NAME, NET_WORK_CONFIG_BY_CHAINID } = require("../helper.hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { account1 } = await getNamedAccounts();
    const { deploy, log, get } = deployments;

    let sourceChainRouter, linkToken;

    if (DEV_NETWORK_NAME.includes(network.name)) {
      const ccipSimulatorDeployment = await get("CCIPLocalSimulator");
      const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator",ccipSimulatorDeployment.address);
      const config = await ccipSimulator.configuration();

      sourceChainRouter = config.sourceRouter_;
      linkToken = config.linkToken_;

      log(`[本地环境] Router:${sourceChainRouter}, LINK:${linkToken}`);
    } else {
      const { chainId } = network.config;
      const config = NET_WORK_CONFIG_BY_CHAINID[chainId];

      sourceChainRouter = config.router;
      linkToken = config.linkToken;

      log(`[非本地环境] Router:${sourceChainRouter}, LINK:${linkToken}`);
    }

    const nftDeployment = await get("MyNFT");
    const result = await deploy("LockAndReleaseNFT", {
      contract: "LockAndReleaseNFT",
      from: account1,
      log: false,
      args: [sourceChainRouter, linkToken, nftDeployment.address],
    });
    console.log("LockAndReleaseNFT已部署,地址:", result.address);
};

module.exports.tags = ["all", "source"];
