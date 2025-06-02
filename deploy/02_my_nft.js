module.exports = async({ getNamedAccounts, deployments }) => {
    const { account1 } = await getNamedAccounts()

    const { deploy } = deployments
    const result = await deploy("MyNFT", {
        contract: "MyNFT",
        from: account1,
        log: false,
        args: ["MyNFT", "MyNFT"]
    });
    console.log("MyNFT已部署,地址:", result.address);
}

module.exports.tags = ["all", "source"]