const { task, chainIdConfig } = require("hardhat/config")

task("lock-and-cross")
    .addParam("tokenid", "tokenId to be locked and crossed")
    .addOptionalParam("chainselector", "chain selector of destination chain")
    .addOptionalParam("receiver", "receiver in the destination chain").setAction(async(taskArgs, hre) => {
        const tokenId = taskArgs.tokenid

        const { deployerAddr } = await getNamedAccounts()
        console.log(`deployer is ${deployerAddr}`)

        let destReceiver
        if(taskArgs.receiver) {
            destReceiver = taskArgs.receiver
        } else {
            const nftBurnAndMint = await hre.companionNetworks["destChain"].deployments.get("NFTPoolBurnAndMint")
            destReceiver = nftBurnAndMint.address
        }
        console.log(`NFTPoolBurnAndMint address on destination chain is ${destReceiver}`)

        let destChainSelector
        if(taskArgs.chainselector) {
            destChainSelector = taskArgs.chainselector
        } else {
            destChainSelector = chainIdConfig[network.config.chainId].companionChainSelector
        }
        console.log(`destination chain selector is ${destChainSelector}`)

        const linkTokenAddr = chainIdConfig[network.config.chainId].linkToken
        const linkToken = await ethers.getContractAt("LinkToken", linkTokenAddr)
        const nftPoolLockAndRelease = await ethers.getContract("NFTPoolLockAndRelease", deployerAddr)
        
        const balanceBefore = await linkToken.balanceOf(nftPoolLockAndRelease.target)
        console.log(`balance before: ${balanceBefore}`)
        const transferTx = await linkToken.transfer(nftPoolLockAndRelease.target, ethers.parseEther("10"))
        await transferTx.wait(6)
        const balanceAfter = await linkToken.balanceOf(nftPoolLockAndRelease.target)
        console.log(`balance after: ${balanceAfter}`)

        const nft = await ethers.getContract("MyToken", deployerAddr)
        await nft.approve(nftPoolLockAndRelease.target, tokenId)
        console.log("approve successfully")

        console.log(`${tokenId}, ${deployerAddr}, ${destChainSelector}, ${destReceiver}`)
        const lockAndCrossTx = await nftPoolLockAndRelease
            .lockAndSendNFT(
            tokenId, 
            deployerAddr, 
            destChainSelector, 
            destReceiver
        )
        
        console.log(`NFT locked and crossed, transaction hash is ${lockAndCrossTx.hash}`)
})

module.exports = {}