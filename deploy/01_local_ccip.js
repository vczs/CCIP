const { network } = require("hardhat");
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    if (DEV_NETWORK_NAME.includes(network.name)) {
        const { deploy } = deployments;
        const { account1 } = await getNamedAccounts();
        const result = await deploy("CCIPLocalSimulator", {
            contract: "CCIPLocalSimulator",
            from: account1,
            log: false,
            args: [],
        });
        console.log("CCIPLocalSimulator已部署,地址:", result.address);
    }
};

module.exports.tags = ["all"];
