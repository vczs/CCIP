module.exports = async({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    
    log(`deploying NFT`)
    await deploy("NFT", {
        contract: "NFT",
        from: deployer,
        log: true,
        args: ["NFT", "NFT"]
    })
}

module.exports.tags = ["all", "sourcechain"]