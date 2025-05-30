module.exports = async({getNamedAccounts, deployments}) => {
    const { account1 } = await getNamedAccounts();
    const { deploy, log } = deployments

    const result = await deploy("WrappedNFT", {
        contract: "WrappedNFT",
        from: account1,
        log: false,
        args: ["WrappedNFT", "WNFT"]
    })
    console.log("WrappedNFT已部署,地址:", result.address);
}

module.exports.tags = ["all", "destchain"]