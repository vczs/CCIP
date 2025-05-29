const { task } = require("hardhat/config")

task("mint-nft").setAction(async(taskArgs, hre) => {
    const { ethers } = hre;

    const { account1 } = await ethers.getSigners();

    const nftDeployment = await deployments.get("NFT");
    const nft = await ethers.getContractAt("NFT", nftDeployment.address);
    console.log(`nft address is ${nftDeployment.address}`)
  
    console.log("minting NFT...")
    const mintTx = await nft.connect(account1).safeMint(deployerAddr,"ipfs://QmbiwVCeCesP89jL39iraBzSp8HoRn3UNQaf2J7YjhwG5s")
    await mintTx.wait(6)
    const tokenAmount = await nft.connect(account1).totalSupply()
    const tokenId = tokenAmount - 1
    console.log(`NFT minted, tokenId is ${tokenId}`)
})

module.exports = {}