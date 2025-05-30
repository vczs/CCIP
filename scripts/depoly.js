const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`部署者地址：${deployer.address}`);

    // 部署本地 CCIP 模拟器
    const localCCIP = await ethers.getContractFactory("CCIPLocalSimulator")
        .then(factory => factory.connect(deployer).deploy());
    const { chainSelector_, sourceRouter_, destinationRouter_, wrappedNative_, linkToken_, ccipBnM_, ccipLnM_ } =
        await localCCIP.configuration();

    console.log(`本地 CCIP 部署完成`);
    console.log(`ChainSelector：${chainSelector_}`);
    console.log(`SourceRouter：${sourceRouter_}`);
    console.log(`DestinationRouter：${destinationRouter_}`);
    console.log(`WrappedNative：${wrappedNative_}`);
    console.log(`LinkToken：${linkToken_}`);
    console.log(`ccipBnM：${ccipBnM_}`);
    console.log(`ccipLnM：${ccipLnM_}`);

    // 部署 MyNFT 合约
    const nft = await ethers.getContractFactory("MyNFT")
        .then(factory => factory.connect(deployer).deploy("MyNFT", "MyNFT"));
    await nft.waitForDeployment();
    console.log(`MyNFT 合约已部署，地址：${nft.target}`);

    // 部署 LockAndReleaseNFT 合约
    const lockAndReleaseNFT = await ethers.getContractFactory("LockAndReleaseNFT")
        .then(factory => factory.connect(deployer).deploy(sourceRouter_, linkToken_, nft.target));
    await lockAndReleaseNFT.waitForDeployment();
    console.log(`LockAndReleaseNFT 合约已部署，地址：${lockAndReleaseNFT.target}`);

    // 部署 WrappedNFT 合约
    const wrappedNft = await ethers.getContractFactory("WrappedNFT")
        .then(factory => factory.connect(deployer).deploy("WNFT", "WNFT"));
    await wrappedNft.waitForDeployment();
    console.log(`WrappedNFT 合约已部署，地址：${wrappedNft.target}`);

    // 部署 MintAndBurnNFT 合约
    const mintAndBurnNFT = await ethers.getContractFactory("MintAndBurnNFT")
        .then(factory => factory.connect(deployer).deploy(destinationRouter_, linkToken_, wrappedNft.target));
    await mintAndBurnNFT.waitForDeployment();
    console.log(`MintAndBurnNFT 合约已部署，地址：${mintAndBurnNFT.target}`);

    // mint 一个 NFT
    await nft.safeMint(deployer, "ipfs://QmbiwVCeCesP89jL39iraBzSp8HoRn3UNQaf2J7YjhwG5s");
    const nftOwnedByDeployer = await nft.balanceOf(deployer);
    console.log(`成功 mint 一个 NFT，当前拥有数量：${nftOwnedByDeployer}`);

    const owner = await nft.ownerOf(0);
    console.log(`TokenId 0 的所有者为：${owner}`);

    // 模拟发 LINK Token
    const linkTokenFactory = await ethers.getContractFactory("LinkToken");
    const linkToken = await linkTokenFactory.attach(linkToken_);
    const balanceBefore = await linkToken.balanceOf(lockAndReleaseNFT.target);
    console.log(`LockAndReleaseNFT 合约 LINK 余额（转账前）：${balanceBefore}`);

    await localCCIP.requestLinkFromFaucet(lockAndReleaseNFT.target, ethers.parseEther("100"));
    const balanceAfter = await linkToken.balanceOf(lockAndReleaseNFT.target);
    console.log(`LockAndReleaseNFT 合约 LINK 余额（转账后）：${balanceAfter}`);

    // 授权 NFT 给 LockAndReleaseNFT
    await nft.approve(lockAndReleaseNFT.target, 0);
    console.log(`已授权 LockAndReleaseNFT 操作 TokenId 0`);

    // 跨链转移 NFT
    await lockAndReleaseNFT.lockAndSendNFT(0, deployer, chainSelector_, mintAndBurnNFT.target);
    console.log(`已执行 lockAndSendNFT`);

    // 查询 WrappedNFT 中的新所有权
    const balanceOfNewOwner = await wrappedNft.balanceOf(deployer);
    console.log(`WrappedNFT 中部署者拥有的 NFT 数量：${balanceOfNewOwner}`);

    const newOwner = await wrappedNft.ownerOf(0);
    console.log(`WrappedNFT 中 TokenId 0 的所有者为：${newOwner}`);
}

main().catch((e) => {
    console.error("发生错误：", e);
    process.exit(1);
});
