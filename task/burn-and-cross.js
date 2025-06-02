const { task } = require("hardhat/config");
const { NET_WORK_CONFIG_BY_CHAINID } = require("../helper.hardhat.config");

task("burn-and-cross")
  .addParam("tokenid", "token id to be burned and crossed")
  .addOptionalParam("chainselector", "chain selector of destination chain")
  .addOptionalParam("receiver", "receiver in the destination chain")
  .setAction(async (taskArgs, hre) => {
    const { ethers, network } = hre;

    const [deployer] = await ethers.getSigners();
    const currentNetworkName = network.name;
    const currentNetworkchainId = network.config.chainId;
    const tokenId = taskArgs.tokenid;

    console.log(`部署者地址为:${deployer.address}`);
    console.log(`当前网络名:${currentNetworkName}，当前网络链ID:${currentNetworkchainId}`);
    console.log(`跨链的 NFT Token ID: ${tokenId}`);

    // 获取目标链的 Chain Selector
    let chainSelector = taskArgs.chainselector;
    if (!chainSelector) {
      const chainConfig = NET_WORK_CONFIG_BY_CHAINID[currentNetworkchainId];
      chainSelector = chainConfig.companionChainSelector;
    }
    console.log(`目标链 Chain Selector: ${chainSelector}`);

    // 获取目标链接收地址
    let receiver = taskArgs.receiver;
    if (!receiver) {
      const lockAndReleaseNFT = await hre.companionNetworks["destChain"].deployments.get("LockAndReleaseNFT")
      receiver = lockAndReleaseNFT.address;
    }
    console.log(`目标链上的 destReceiver 合约地址为: ${receiver}`);

    // 获取合约实例
    const wrappedNFTDeployment = await deployments.get("WrappedNFT");
    const wrappedNFT = await ethers.getContractAt("WrappedNFT", wrappedNFTDeployment.address);
    console.log(`WrappedNFT 合约地址:${wrappedNFTDeployment.address}`);
    const mintAndBurnNFTDeployment = await deployments.get("MintAndBurnNFT");
    const mintAndBurnNFT = await ethers.getContractAt("MintAndBurnNFT", mintAndBurnNFTDeployment.address);
    console.log(`MintAndBurnNFT 合约地址:${mintAndBurnNFTDeployment.address}`);

    // 授权 NFT
    console.log(`授权 MintAndBurnNFT 操作 WrappedNFT（Token ID: ${tokenId}），等待 5 个区块确认...`);
    const approveTx = await wrappedNFT.approve(mintAndBurnNFT.target, tokenId);
    await approveTx.wait(5);

    /*
    // 获取linkToken
    const linkTokenAddress = NET_WORK_CONFIG_BY_CHAINID[currentNetworkchainId].linkToken;
    const linkToken = await ethers.getContractAt("LinkToken", linkTokenAddress);
    console.log(`LinkToken 合约地址: ${linkTokenAddress}`);

    // 发送 LINK 作为费用
    console.log(`向linkToken中为 MintAndBurnNFT合约 充值LINK，等待5个区块确认...`);
    const transferTx = await linkToken.transfer(mintAndBurnNFT.target, ethers.parseEther("1"));
    await transferTx.wait(5);
    const balanceAfter = await linkToken.balanceOf(mintAndBurnNFT.target);
    console.log(`MintAndBurnNFT合约在linkToken中 LINK 余额:${balanceAfter}`);
    */

    // 执行跨链操作
    console.log(`执行 burnAndMint 操作...`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`发送者: ${deployer.address}`);
    console.log(`Chain Selector: ${chainSelector}`);
    console.log(`接收者: ${receiver}`);

    const burnAndCrossTx = await mintAndBurnNFT.burnAndMint(
      tokenId,
      deployer.address,
      chainSelector,
      receiver
    );
    console.log(`跨链交易已发送，交易哈希: ${burnAndCrossTx.hash}`);
  });

module.exports = {};