const { ethers, deployments } = require("hardhat")
const { expect } = require("chai")

let deployer
let nft
let wnft
let lockAndReleaseNFT
let mintAndBurnNFT
let ccipLocalSimulator
let chainSelector

before(async function () {
    [deployer] = await ethers.getSigners()
    console.log(`部署账户地址为: ${deployer.address}`)

    await deployments.fixture(["all"])
    console.log("合约部署完毕，开始获取部署信息...")

    const nftDeployment = await deployments.get("MyNFT")
    nft = await ethers.getContractAt("MyNFT", nftDeployment.address)
    console.log(`MyNFT 合约地址为: ${nftDeployment.address}`)

    const wnftDeployment = await deployments.get("WrappedNFT")
    wnft = await ethers.getContractAt("WrappedNFT", wnftDeployment.address)
    console.log(`WrappedNFT 合约地址为: ${wnftDeployment.address}`)

    const lockAndReleaseNFTDeployment = await deployments.get("LockAndReleaseNFT")
    lockAndReleaseNFT = await ethers.getContractAt("LockAndReleaseNFT", lockAndReleaseNFTDeployment.address)
    console.log(`LockAndReleaseNFT 合约地址为: ${lockAndReleaseNFTDeployment.address}`)

    const mintAndBurnNFTDeployment = await deployments.get("MintAndBurnNFT")
    mintAndBurnNFT = await ethers.getContractAt("MintAndBurnNFT", mintAndBurnNFTDeployment.address)
    console.log(`MintAndBurnNFT 合约地址为: ${mintAndBurnNFTDeployment.address}`)

    const localCCIPDeployment = await deployments.get("CCIPLocalSimulator")
    ccipLocalSimulator = await ethers.getContractAt("CCIPLocalSimulator", localCCIPDeployment.address)
    console.log(`CCIPLocalSimulator 合约地址为: ${localCCIPDeployment.address}`)

    const config = await ccipLocalSimulator.configuration()
    chainSelector = config.chainSelector_
    console.log(`本链的 Chain Selector 为: ${chainSelector}`)
})

describe("测试 NFT 铸造功能", async function () {
    it("NFT 的拥有者应该是铸造者", async function () {
        await nft.safeMint(deployer.address, "ipfs://QmbiwVCeCesP89jL39iraBzSp8HoRn3UNQaf2J7YjhwG5s")
        const ownerOfNft = await nft.ownerOf(0)
        expect(ownerOfNft).to.equal(deployer.address)
    })
})

describe("测试 NFT 锁仓并跨链转移功能", async function () {
    it("锁仓合约接收 NFT，NFT 拥有者应为锁仓合约", async function () {
        await ccipLocalSimulator.requestLinkFromFaucet(lockAndReleaseNFT.target, ethers.parseEther("1"))

        await nft.approve(lockAndReleaseNFT.target, 0)
        await lockAndReleaseNFT.lockAndSendNFT(0, deployer.address, chainSelector, mintAndBurnNFT.target)

        const newOwner = await nft.ownerOf(0)
        expect(newOwner).to.equal(lockAndReleaseNFT.target)
    })

    it("目的链上的 WrappedNFT 拥有者应为原持有者", async function () {
        const newOwner = await wnft.ownerOf(0)
        expect(newOwner).to.equal(deployer.address)
    })
})

describe("测试跨链返回原链并销毁 WrappedNFT", async function () {
    it("WrappedNFT 成功销毁", async function () {
        await ccipLocalSimulator.requestLinkFromFaucet(lockAndReleaseNFT.target, ethers.parseEther("1"))

        await wnft.approve(mintAndBurnNFT.target, 0)
        await mintAndBurnNFT.burnAndMint(0, deployer.address, chainSelector, lockAndReleaseNFT.target)

        const wnftTotalSupply = await wnft.totalSupply()
        expect(wnftTotalSupply).to.equal(0)
    })

    it("原链 NFT 拥有者应为部署者", async function () {
        const newOwner = await nft.ownerOf(0)
        expect(newOwner).to.equal(deployer.address)
    })
})