//SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {NFT} from "./NFT.sol";

contract WrappedNFT is NFT {
    constructor(string memory tokenName, string memory tokenSymbol) 
    NFT(tokenName, tokenSymbol) {}

    function mintWithSpecificTokenId(address to, uint256 _tokenId) public {
        _safeMint(to, _tokenId);
    }
}