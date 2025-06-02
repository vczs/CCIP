# CCIP contract

```shell
npm init -y
npm install -D hardhat
npx hardhat init
```

```shell
npm install -D @openzeppelin/contracts
npm install -D @chainlink/env-enc
npm install -D @chainlink/contracts-ccip 
npm install -D @chainlink/local
npm install -D hardhat-deploy
```

```shell
npx env-enc set-pw
npx env-enc set
```

```shell
npx hardhat clean
npx hardhat compile
```

```shell
npx hardhat node
npx hardhat run ./scripts/depoly.js --network localhost
npx hardhat deploy --tags all --network localhost --reset
npx hardhat test --network hardhat

# task
npx hardhat deploy --tags source --network sepolia
npx hardhat deploy --tags dest --network amoy
npx hardhat mint-nft --network sepolia
npx hardhat check-nft --network sepolia
npx hardhat lock-and-cross --tokenid 1 --network sepolia
npx hardhat check-wnft --tokenid 1 --network amoy
npx hardhat burn-and-cross --tokenid 1 --network amoy

# localhost 挖矿
npx hardhat console --network localhost
await network.provider.send("evm_mine")
```