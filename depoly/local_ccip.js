const { network } = require("hardhat");
const { developmentChains } = require("../dev.hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    if (developmentChains.includes(network.name)) {
        const { deployer } = await getNamedAccounts();
        const { deploy, log } = deployments;

        log("正在部署 CCIP 本地模拟器...");
        await deploy("CCIPLocalSimulator", {
            contract: "CCIPLocalSimulator",
            from: deployer,
            log: true,
            args: [],
        });
        log("CCIP 本地模拟器部署完成！");
    } else {
        log("不在本地网络，跳过 CCIP 本地模拟器部署。");
    }
};

module.exports.tags = ["all", "local"];