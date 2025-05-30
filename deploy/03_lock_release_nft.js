const { network, ethers, chainIdConfig } = require("hardhat");
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config");

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
      const config = chainIdConfig[chainId];

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

module.exports.tags = ["all", "sourcechain"];
