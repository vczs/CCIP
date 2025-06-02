const { task } = require("hardhat/config")

task("mint-nft").setAction(async(taskArgs, hre) => {
    const { ethers, deployments } = hre;

    const [account1] = await ethers.getSigners();

    const nftDeployment = await deployments.get("MyNFT");
    const nft = await ethers.getContractAt("MyNFT", nftDeployment.address);
    console.log(`MyNFT合约地址${nftDeployment.address}`);
  
    console.log("开始铸造NFT")
    const tx = await nft.connect(account1).safeMint(account1.address, "ipfs://QmbiwVCeCesP89jL39iraBzSp8HoRn3UNQaf2J7YjhwG5s")
    console.log("等待6个区块确认...")
    await tx.wait(6)

    const tokenAmount = await nft.connect(account1).totalSupply()
    const tokenId = tokenAmount - 1n
    console.log(`NFT铸造成功, 交易哈希: ${tx.hash}, tokenId: ${tokenId}`);
})

module.exports = {}