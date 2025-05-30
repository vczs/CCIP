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
npx hardhat run ./scripts/depoly.js
```

```shell
npx hardhat node
npx hardhat deploy --tags all --network localhost
npx hardhat {task-name} --network localhost

npx hardhat console --network localhost
await network.provider.send("evm_mine")
```