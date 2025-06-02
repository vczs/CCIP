const { network, ethers } = require("hardhat");
const { DEV_NETWORK_NAME, NET_WORK_CONFIG_BY_CHAINID } = require("../helper.hardhat.config");

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
        log(`[本地环境] Router:${router}, LINK:${linkTokenAddr}`);
    } else {
        const config = NET_WORK_CONFIG_BY_CHAINID[network.config.chainId];
        router = config.router;
        linkTokenAddr = config.linkToken;
        log(`[非本地环境] Router:${router}, LINK:${linkTokenAddr}`);
    }

    const wrappedNFTDeployment = await get("WrappedNFT");
    const result = await deploy("MintAndBurnNFT", {
        contract: "MintAndBurnNFT",
        from: account1,
        log: false,
        args: [router, linkTokenAddr, wrappedNFTDeployment.address],
    });

    console.log("MintAndBurnNFT部署完成，合约地址:", result.address);
};

module.exports.tags = ["all", "dest"];
