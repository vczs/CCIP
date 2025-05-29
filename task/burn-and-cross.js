const { task, chainIdConfig } = require("hardhat/config")

task("burn-and-cross")
    .addParam("tokenid", "token id to be burned and crossed")
    .addOptionalParam("chainselector", "chain selector of destination chain")
    .addOptionalParam("receiver", "receiver in the destination chain")
    .setAction(async(taskArgs, hre) => {
        const { deployerAddr } = await getNamedAccounts()

        const tokenId = taskArgs.tokenid
        const wnft = await hre.ethers.getContract("WrappedNFT", deployerAddr)
        const nftPoolBurnAndMint = await ethers.getContract("NFTPoolBurnAndMint", deployerAddr)
        
        const approveTx = await wnft.approve(nftPoolBurnAndMint.target, tokenId)
        await approveTx.wait(6)

        console.log("transfering 10 LINK token to NFTPoolBurnAndMint contract")
        const linkAddr = chainIdConfig[network.config.chainId].linkToken
        const linkToken = await ethers.getContractAt("LinkToken", linkAddr)
        const transferTx = await linkToken.transfer(nftPoolBurnAndMint.target, ethers.parseEther("10"))
        await transferTx.wait(6)

        let chainSelector
        if(taskArgs.chainselector) {
            chainSelector = taskArgs.chainselector
        } else {
            chainSelector = chainIdConfig[network.config.chainId].companionChainSelector
        }

        let receiver
        if(taskArgs.receiver) {
            receiver = taskArgs.receiver
        } else {
            receiver = (await hre.companionNetworks["destChain"].deployments.get("NFTPoolLockAndRelease")).address
        }

        const burnAndCrossTx = await nftPoolBurnAndMint.burnAndMint(tokenId, deployerAddr, chainSelector, receiver)
        console.log(`NFT burned and crossed with txhash ${burnAndCrossTx.hash}`)
})

module.exports = {}