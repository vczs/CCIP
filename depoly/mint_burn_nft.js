const { network, chainIdConfig } = require("hardhat")
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config")

module.exports = async({getNamedAccounts, deployments}) => {
    const { deployerAddr } = await getNamedAccounts()
    const { deploy, log } = deployments
    
    let router, linkTokenAddr
    if(DEV_NETWORK_NAME.includes(network.name)) {
        const ccipSimulatorTx = await deployments.get("CCIPLocalSimulator")
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorTx.address)
        const ccipConfig = await ccipSimulator.configuration()
        router = ccipConfig.destinationRouter_
        linkTokenAddr = ccipConfig.linkToken_        
    } else {
        router = chainIdConfig[network.config.chainId].router
        linkTokenAddr = chainIdConfig[network.config.chainId].linkToken
    }

    const wnftTx = await deployments.get("WrappedNFT")
    log(`deploying mintAndBurnNFT, router:${router}, linkTokenAddr:${linkTokenAddr}, wnftTxAddress:${wnftTx.address}`)
    await deploy("MintAndBurnNFT", {
        contract: "MintAndBurnNFT",
        from: deployerAddr,
        log: true,
        args: [router, linkTokenAddr, wnftTx.address]
    })
}

module.exports.tags = ["all", "destchain"]