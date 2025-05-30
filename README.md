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
npx hardhat run ./scripts/depoly.js

npx hardhat deploy --tags all
npx hardhat {task-name}
```

```shell
npx hardhat clean
npx hardhat compile
npx hardhat deploy --tags all --network hardhat
```