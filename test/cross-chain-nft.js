const { deployments, ethers } = require("hardhat")
const { expect } = require("chai")

let deployer
let nft
let wnft
let lockAndReleaseNFT
let mintAndBurnNFT
let chainSelector

before(async function(){
   [ deployer ] = await ethers.getNamedAccounts();
    
    await deployments.fixture(["all"])
    nft = await ethers.getContract("NFT", deployer)
    wnft = await ethers.getContract("WrappedNFT", deployer)
    lockAndReleaseNFT = await ethers.getContract("LockAndReleaseNFT", deployer)
    mintAndBurnNFT = await ethers.getContract("MintAndBurnNFT", deployer)
    localCCIP = await ethers.getContract("CCIPLocalSimulator", deployer)
    chainSelector = (await localCCIP.configuration()).chainSelector_
})

describe("test if the nft can be minted successfully", async function(){
    it("test if the owner of nft is minter", async function(){
        await nft.safeMint(deployer,"ipfs://QmbiwVCeCesP89jL39iraBzSp8HoRn3UNQaf2J7YjhwG5s")
        const ownerOfNft = await nft.ownerOf(0)
        expect(ownerOfNft).to.equal(deployer)
    })
})

describe("test if the nft can be locked and transferred to destchain", async function() {
    it("transfer NFT from source chain to dest chain, check if the nft is locked", async function() {
        await ccipLocalSimulator.requestLinkFromFaucet(lockAndReleaseNFT.target, ethers.parseEther("10"))

        await nft.approve(poolLnU.target, 0)
        await poolLnU.lockAndSendNFT(0, deployer, chainSelector, poolMnB.target)
        
        const newOwner = await nft.ownerOf(0)
        expect(newOwner).to.equal(poolLnU.target)
    })

    it("check if wnft's account is owner", async function() {
        const newOwner = await wnft.ownerOf(0)
        expect(newOwner).to.equal(deployer)
    })
})

describe("test if the nft can be burned and transferred back to sourcechain", async function() {
    it("wnft can be burned", async function() {
        ccipLocalSimulator.requestLinkFromFaucet(lockAndReleaseNFT.target, ethers.parseEther("10"))
        
        await wnft.approve(poolMnB.target, 0)
        await poolMnB.burnAndMint(0, deployer, chainSelector, poolLnU.target)
        const wnftTotalSupply = await wnft.totalSupply()
        expect(wnftTotalSupply).to.equal(0)
    })
    
    it("owner of the NFT is transferred to deployer", async function() {
        const newOwner = await nft.ownerOf(0)
        expect(newOwner).to.equal(deployer)
    })
})