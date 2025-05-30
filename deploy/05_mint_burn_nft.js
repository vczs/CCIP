const { network, ethers } = require("hardhat");
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { account1 } = await getNamedAccounts();
    const { deploy, log, get } = deployments;

    let router, linkTokenAddr;

    if (DEV_NETWORK_NAME.includes(network.name)) {
        const simulatorDeployment = await get("CCIPLocalSimulator");
        const simulator = await ethers.getContractAt("CCIPLocalSimulator", simulatorDeployment.address);
        const config = await simulator.configuration();

        router = config.destinationRouter_;
        linkTokenAddr = config.linkToken_;

        log(`本地环境部署：Router 地址为 ${router}，LINK 代币地址为 ${linkTokenAddr}`);
    } else {
        const { chainId } = network.config;
        const config = chainIdConfig[chainId];

        router = config.router;
        linkTokenAddr = config.linkToken;

        log(`非本地环境部署：Router 地址为 ${router}，LINK 代币地址为 ${linkTokenAddr}`);
    }

    const wrappedNFTDeployment = await get("WrappedNFT");

    log(`正在部署 MintAndBurnNFT 合约，WrappedNFT 地址为: ${wrappedNFTDeployment.address}`);

    await deploy("MintAndBurnNFT", {
        contract: "MintAndBurnNFT",
        from: account1,
        log: true,
        args: [router, linkTokenAddr, wrappedNFTDeployment.address],
    });

    log("MintAndBurnNFT 合约部署完成");
};

module.exports.tags = ["all", "destchain"];
