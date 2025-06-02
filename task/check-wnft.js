const { task } = require("hardhat/config")

task("check-wnft").addParam("tokenid", "tokenid to check")
  .setAction(async(taskArgs, hre) => {
    const [deployer] = await ethers.getSigners();
    const tokenId = taskArgs.tokenid;
    console.log(`部署者地址为:${deployer.address}`);
    console.log(`跨链tokenId:${tokenId}`);

    const wrappedNFTDeployment = await deployments.get("WrappedNFT");
    const wrappedNFT = await ethers.getContractAt("WrappedNFT", wrappedNFTDeployment.address);
    console.log("正在查询 WrappedNFT 合约中的 Token ...");
    const totalSupply = await wrappedNFT.totalSupply();
    console.log(`WrappedNFT合约中 NFT 总量为: ${totalSupply.toString()} 个`);

    try {
      const owner = await wrappedNFT.ownerOf(tokenId);
      console.log(`TokenId ${tokenId} 的拥有者地址为:${owner}`);
    } catch (error) {
      console.error(`查询失败:TokenId ${tokenId} 不存在或尚未被铸造`);
    }
    console.log("查询结束");
})

module.exports = {}