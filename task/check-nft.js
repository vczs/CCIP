const { task } = require("hardhat/config")

task("check-nft").setAction(async(taskArgs, hre) => {
    const { ethers, deployments } = hre;

    const nftDeployment = await deployments.get("MyNFT");
    const nft = await ethers.getContractAt("MyNFT", nftDeployment.address);

    const totalSupply = await nft.totalSupply()
    console.log(`MyNFT合约共${totalSupply}个NFT。`)
    for(let tokenId = 0; tokenId < totalSupply; tokenId++) {
        const owner = await nft.ownerOf(tokenId)
        console.log(`TokenId: ${tokenId}, Owner is ${owner}`)
    }
})

module.exports = {}