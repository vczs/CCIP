module.exports = async({getNamedAccounts, deployments}) => {
    const { deployerAddr } = await getNamedAccounts()
    const {deploy, log} = deployments
    
    log(`deploying NFT`)
    await deploy("NFT", {
        contract: "NFT",
        from: deployerAddr,
        log: true,
        args: ["NFT", "NFT"]
    })
}

module.exports.tags = ["all", "sourcechain"]