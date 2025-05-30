module.exports = async({ getNamedAccounts, deployments }) => {
    const { account1 } = await getNamedAccounts()
    const { deploy, log } = deployments
    
    log("部署NFT");
    await deploy("NFT", {
        contract: "NFT",
        from: account1,
        log: true,
        args: ["NFT", "NFT"]
    })
    log("NFT部署完成");
}

module.exports.tags = ["all", "sourcechain"]