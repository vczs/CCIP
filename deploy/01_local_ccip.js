const { network } = require("hardhat");
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    if (DEV_NETWORK_NAME.includes(network.name)) {
        const { deploy, log } = deployments;
        const { account1 } = await getNamedAccounts();
        log("部署CCIPLocalSimulator");
        await deploy("CCIPLocalSimulator", {
            contract: "CCIPLocalSimulator",
            from: account1,
            log: true,
            args: [],
        });
        log("CCIPLocalSimulator部署完成");
    }
};

module.exports.tags = ["all", "local"];
