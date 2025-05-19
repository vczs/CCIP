const { network, chainIdConfig } = require("hardhat")
const { DEV_NETWORK_NAME } = require("../dev.hardhat.config")

module.exports = async({getNamedAccounts, deployments}) => {
    const { deployerAddr } = await getNamedAccounts()
    const { deploy, log } = deployments

    let sourceChainRouter, linkToken
    if(DEV_NETWORK_NAME.includes(network.name)) {
        const ccipSimulatorTx = await deployments.get("CCIPLocalSimulator")
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorTx.address)
        const ccipSimulatorConfig = await ccipSimulator.configuration()
        sourceChainRouter = ccipSimulatorConfig.sourceRouter_
        linkToken = ccipSimulatorConfig.linkToken_       
        log(`local environment: sourcechain router: ${sourceChainRouter}, link token: ${linkToken}`) 
    } else {
        sourceChainRouter = chainIdConfig[network.config.chainId].router
        linkToken = chainIdConfig[network.config.chainId].linkToken
        log(`non local environment: sourcechain router: ${sourceChainRouter}, link token: ${linkToken}`)
    }
    
    const nftTx = await deployments.get("NFT")
    log(`deploying lockAndReleaseNFT ,NFT address: ${nftTx.address}`)
    await deploy("LockAndReleaseNFT", {
        contract: "LockAndReleaseNFT",
        from: deployerAddr,
        log: true,
        args: [sourceChainRouter, linkToken, nftTx.address]
    })
}

module.exports.tags = ["all", "sourcechain"]