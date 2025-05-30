const { network, ethers } = require("hardhat");
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { account1 } = await getNamedAccounts();
  const { deploy, log, get } = deployments;

  let sourceChainRouter, linkToken;

  if (DEV_NETWORK_NAME.includes(network.name)) {
    const ccipSimulatorDeployment = await get("CCIPLocalSimulator");
    const ccipSimulator = await ethers.getContractAt(
      "CCIPLocalSimulator",
      ccipSimulatorDeployment.address
    );
    const config = await ccipSimulator.configuration();

    sourceChainRouter = config.sourceRouter_;
    linkToken = config.linkToken_;

    log(`本地环境部署：Router 地址: ${sourceChainRouter}, LINK 地址: ${linkToken}`);
  } else {
    const { chainId } = network.config;
    const config = chainIdConfig[chainId];

    sourceChainRouter = config.router;
    linkToken = config.linkToken;

    log(`非本地环境部署：Router 地址: ${sourceChainRouter}, LINK 地址: ${linkToken}`);
  }

  const nftDeployment = await get("NFT");
  log(`正在部署 LockAndReleaseNFT，NFT 合约地址为: ${nftDeployment.address}`);

  await deploy("LockAndReleaseNFT", {
    contract: "LockAndReleaseNFT",
    from: account1,
    log: true,
    args: [sourceChainRouter, linkToken, nftDeployment.address],
  });

  log("LockAndReleaseNFT 合约部署完成");
};

module.exports.tags = ["all", "sourcechain"];
