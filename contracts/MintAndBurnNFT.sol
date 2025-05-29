// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

import {WrappedNFT} from "./WrappedNFT.sol";

contract MintAndBurnNFT is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
  
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        bytes text,
        address feeToken,
        uint256 fees
    );

    struct RequestData{
        uint256 tokenId;
        address newOwner;
    }

    bytes32 private s_lastReceivedMessageId;
    string private s_lastReceivedText;

    mapping(uint64 => bool) public allowlistedDestinationChains;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;

    IERC20 private s_linkToken;
    WrappedNFT public wnft;

    receive() external payable {}

    constructor(address _router, address _link, address _wnft) CCIPReceiver(_router) {
        wnft = WrappedNFT(_wnft);
        s_linkToken = IERC20(_link);
    }

    function burnAndMint(uint256 _tokenId, address newOwner, uint64 destChainSelector, address receiver) public {
        wnft.transferFrom(msg.sender, address(this), _tokenId);
        wnft.burn(_tokenId);
        bytes memory payload = abi.encode(_tokenId, newOwner);
        _sendMessagePayLINK(destChainSelector, receiver, payload);
    }

    // 管理员功能，提现合约中ETH
    function withdraw(address _beneficiary) public onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) {
            revert NothingToWithdraw();
        }
        (bool sent, ) = _beneficiary.call{value: amount}("");
        if (!sent) {
            revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
        }
    }

    // 管理员功能，提现合约中任意 ERC20 token
    function withdrawToken(address _beneficiary, address _token) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        if (amount == 0) {
            revert NothingToWithdraw();
        }
        IERC20(_token).safeTransfer(_beneficiary, amount);
    }

    function getLastReceivedMessageDetails()external view returns (bytes32 messageId, string memory text){
        return (s_lastReceivedMessageId, s_lastReceivedText);
    }

    function allowlistDestinationChain(uint64 _destinationChainSelector,bool allowed) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override{
        s_lastReceivedMessageId = any2EvmMessage.messageId;      
        RequestData memory reqData = abi.decode(any2EvmMessage.data, (RequestData));
        address newOwner = reqData.newOwner;
        uint256 tokenId = reqData.tokenId;
        wnft.mintWithSpecificTokenId(newOwner, tokenId);
    }

    // _destinationChainSelector:目标链的 Chainlink Chain Selector 编号
    // _receiver:目标链上负责接收消息的合约地址
    // _payload:跨链传送的数据
    function _sendMessagePayLINK(uint64 _destinationChainSelector, address _receiver, bytes memory _payload) internal returns (bytes32 messageId) {
        IRouterClient router = IRouterClient(getRouter());

        // 构建 CCIP 消息结构体，封装了收件人、数据、gas、token 等
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: _payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000})),
            feeToken: address(s_linkToken)
        });

        // 向router查询本次跨链消息大概要花多少LINK，如果不够就revert
        uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);
        if (fees > s_linkToken.balanceOf(address(this))) {
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);
        }

        // 批准router调用你合约中的 LINK Token
        s_linkToken.approve(address(router), fees);
        // 正式调用 ccipSend 发出跨链消息，获取到messageId
        messageId = router.ccipSend(_destinationChainSelector, evm2AnyMessage);
        emit MessageSent(messageId,_destinationChainSelector, _receiver,_payload,address(s_linkToken),fees);
        
        return messageId;
    }
}