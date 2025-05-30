module.exports = async({getNamedAccounts, deployments}) => {
    const { account1 } = await getNamedAccounts();
    const { deploy, log } = deployments

    log("部署wrappedNFT")
    await deploy("WrappedNFT", {
        contract: "WrappedNFT",
        from: account1,
        log: true,
        args: ["WrappedNFT", "WNFT"]
    })
    log("wrappedNFT部署完成")
}

module.exports.tags = ["all", "destchain"]