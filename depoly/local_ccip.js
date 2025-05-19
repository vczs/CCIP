const { network } = require("hardhat");
const { developmentChains } = require("../dev.hardhat.config")

module.exports = async({getNamedAccounts, deployments}) => {
    if(developmentChains.includes(network.name)) {
        const { deployerAddr } = await getNamedAccounts()
        const { deploy, log } = deployments
        
        log("deploy the CCIP local simulator")
        await deploy("CCIPLocalSimulator", {
            contract: "CCIPLocalSimulator",
            from: deployerAddr,
            log: true,
            args: []
        })
        log("CCIP local simulator deployed!")
    } else {
        log("not in local, skip CCIP local")
    }
}

module.exports.tags = ["all", "local"]