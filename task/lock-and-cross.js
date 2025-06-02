const { task } = require("hardhat/config");
const { NET_WORK_CONFIG_BY_CHAINID } = require("../helper.hardhat.config");

task("lock-and-cross", "锁仓并跨链发送 NFT")
  .addParam("tokenid", "要锁仓并跨链的 NFT 的 tokenId")
  .addOptionalParam("chainselector", "目标链的 Chain Selector")
  .addOptionalParam("receiver", "目标链上的接收地址")
  .setAction(async (taskArgs, hre) => {
    const { ethers, network, deployments } = hre;

    const [deployer] = await ethers.getSigners();
    const currentNetworkName = network.name;
    const currentNetworkchainId = network.config.chainId;
    const tokenId = taskArgs.tokenid;
    console.log(`部署者地址为:${deployer.address}`);
    console.log(`当前网络名:${currentNetworkName}，当前网络链ID:${currentNetworkchainId}`);
    console.log(`跨链的 NFT Token ID: ${tokenId}`);

    // 获取目标链的 Chain Selector
    let destChainSelector = taskArgs.chainselector;
    if (!destChainSelector) {
      const chainConfig = NET_WORK_CONFIG_BY_CHAINID[currentNetworkchainId];
      destChainSelector = chainConfig.companionChainSelector;
    }
    console.log(`目标链的 Chain Selector 为:${destChainSelector}`);

    // 获取目标链接收地址
    let destReceiver = taskArgs.receiver;
    if (!destReceiver) {
      const nftBurnAndMint = await hre.companionNetworks["destChain"].deployments.get("MintAndBurnNFT")
      destReceiver = nftBurnAndMint.address;
    }
    console.log(`目标链上的 destReceiver 合约地址为: ${destReceiver}`);

    // 获取合约实例
    const nftDeployment = await deployments.get("MyNFT");
    const nft = await ethers.getContractAt("MyNFT", nftDeployment.address);
    console.log(`MyNFT合约地址:${nftDeployment.address}`);
    const lockAndReleaseNFTDeployment = await deployments.get("LockAndReleaseNFT");
    const lockAndReleaseNFT = await ethers.getContractAt("LockAndReleaseNFT", lockAndReleaseNFTDeployment.address);
    console.log(`LockAndReleaseNFT合约地址:${lockAndReleaseNFTDeployment.address}`);

    // 授权 NFT
    console.log(`MyNFT 授权 lockAndReleaseNFT 对 tokenId[${tokenId}] 操作,等待5个区块确认...`);
    const approveTx = await nft.approve(lockAndReleaseNFT.target, tokenId);
    await approveTx.wait(5);
    console.log(`已授权 NFT（tokenId=${tokenId}）给 LockAndReleaseNFT 合约`);

    /*
    // 获取linkToken
    const linkTokenAddress = NET_WORK_CONFIG_BY_CHAINID[currentNetworkchainId].linkToken;
    const linkToken = await ethers.getContractAt("LinkToken", linkTokenAddress);
    console.log(`linkToken地址:${linkTokenAddress}`);

    // 发送 LINK 作为费用
    console.log(`向linkToken中为 LockAndReleaseNFT合约 充值LINK，等待5个区块确认...`);
    const transferTx = await linkToken.transfer(lockAndReleaseNFT.target, ethers.parseEther("1"));
    await transferTx.wait(5);
    const balanceAfter = await linkToken.balanceOf(lockAndReleaseNFT.target);
    console.log(`LockAndReleaseNFT合约在linkToken中 LINK 余额:${balanceAfter}`);
    */

    console.log(`准备执行锁仓并跨链:`);
    console.log(`tokenId: ${tokenId}`);
    console.log(`发送者地址: ${deployer.address}`);
    console.log(`目标 Chain Selector: ${destChainSelector}`);
    console.log(`接收者地址: ${destReceiver}`);

    const lockAndCrossTx = await lockAndReleaseNFT.lockAndSendNFT(
      tokenId,
      deployer.address,
      destChainSelector,
      destReceiver
    );
    console.log(`NFT 已锁仓并跨链，交易哈希:${lockAndCrossTx.hash}`);
  });

module.exports = {};