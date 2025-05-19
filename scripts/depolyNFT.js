const { ethers } = require("hardhat");

async function main() {
    const [ deployer ] = await ethers.getSigners()
    
    const localCCIP = await ethers.getContractFactory("CCIPLocalSimulator").then(factory => factory.connect(deployer).deploy());
    const { chainSelector_, sourceRouter_, destinationRouter_, wrappedNative_, linkToken_, ccipBnM_, ccipLnM_} = await localCCIP.DOCUMENTATION();
    console.log(`ChainSelector is ${chainSelector_}`)
    console.log(`SourceRouter is ${sourceRouter_}`)
    console.log(`DestinationRouter is ${destinationRouter_}`)
    console.log(`WrappedNative is ${wrappedNative_}`)
    console.log(`LinkToken is ${linkToken_}`)
    console.log(`ccipBnM is ${ccipBnM_}`)
    console.log(`ccipLnM is ${ccipLnM_}`)


    const nft = await ethers.getContractFactory("NFT").then(factory => factory.connect(deployer).deploy(deployer));
    await nft.waitForDeployment()
    console.log(`NFT is deployed at address ${nft.target}`)

    const lockAndReleaseNFT = await ethers.getContractFactory("LockAndReleaseNFT").then(factory => factory.connect(deployer).deploy(sourceRouter_, linkToken_, nft.target));
    await lockAndReleaseNFT.waitForDeployment()
    console.log(`lockAndReleaseNFT was deployed at address ${lockAndReleaseNFT.target}`)

    const wrappedNft = await ethers.getContractFactory("WrappedNFT").then(factory => factory.connect(deployer).deploy(deployer));
    await wrappedNft.waitForDeployment()
    console.log(`WrappedNFT was deployed at address ${wrappedNft.target}`)

    const mintAndBurnNFT = await ethers.getContractFactory("MintAndBurnNFT").then(factory => factory.connect(deployer).deploy(destinationRouter_, linkToken_, wrappedNft.target));
    console.log(`mintAndBurnNFT was deployed at address ${mintAndBurnNFT.target}`)

    await nft.safeMint(deployer)
    const nftOwnedByDeployer = await nft.balanceOf(deployer)
    console.log(`there was ${nftOwnedByDeployer} nft owned by deployer`)
    const owner = await nft.ownerOf(0)
    console.log(`owner of the tokenId 0 in nft is ${owner}`)

    const linkTokenFactory = await ethers.getContractFactory("LinkToken")
    const linkToken = await linkTokenFactory.attach(linkToken_)
    const balanceBefore = await linkToken.balanceOf(lockAndReleaseNFT.target)
    console.log(`balance before: ${balanceBefore}`)
    await localSimulator.requestLinkFromFaucet(lockAndReleaseNFT.target, ethers.parseEther("100"))
    const balanceAfter = await linkToken.balanceOf(lockAndReleaseNFT.target)
    console.log(`balance before: ${balanceAfter}`)

    await nft.approve(lockAndReleaseNFT.target, 0)
    console.log("approve successfully")
    
    await nftLockAndReleasePool.lockAndCrossChainNft(0,deployer,chainSelector_,nftBurnAndMintPool)

    const balanceOfNewOwner = await wrappedNft.balanceOf(deployer)
    console.log(`balance of new owner in the wrappedNFT is ${balanceOfNewOwner}`)
    const newOwner = await wrappedNft.ownerOf(0)
    console.log(`owner of the tokenId 0 in wrapped NFT is ${newOwner}`)
}

main().then().catch((e)=>{
    console.error(e)
    process.exit(1)
})