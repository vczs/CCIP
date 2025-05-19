module.exports = async({getNamedAccounts, deployments}) => {
    const { deployerAddr } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("deploying wrappedNFT")
    await deploy("WrappedNFT", {
        contract: "WrappedNFT",
        from: deployerAddr,
        log: true,
        args: ["WrappedNFT", "WNFT"]
    })
}

module.exports.tags = ["all", "destchain"]