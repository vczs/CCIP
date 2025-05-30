// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import {MyNFT} from "./MyNFT.sol";

contract LockAndReleaseNFT is CCIPReceiver, OwnerIsCreator {
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

    mapping(uint64 => bool) public allowlistedDestinationChains; // 允许发送消息的链
    mapping(uint64 => bool) public allowlistedSourceChains; // 允许接收消息的链
    mapping(address => bool) public allowlistedSenders; // 允许跨链请求的发送者

    IERC20 private s_linkToken; // 支付 CCIP 的 LINK token
    MyNFT public nft; // 调用者自己NFT合约实例

    mapping(uint256 => bool) public tokenLocked; // 标记某个 NFT 是否已被锁定
    
    receive() external payable {}

    constructor(address _router, address _link, address nftAddr) CCIPReceiver(_router) {
        s_linkToken = IERC20(_link);
        nft = MyNFT(nftAddr);
    }

    // 锁仓与发送 NFT
    // destChainSelector:目标链的唯一标识符，由 Chainlink CCIP 提供，不同链有不同的 selector。用于告诉 CCIP 这条消息要发往哪个区块链
    // destReceiver:目标链上的接收者合约地址，即该消息要发到目标链上哪个合约去处理；这个合约必须有 _ccipReceive 方法(实现了 CCIPReceiver)，用于接收并释放 NFT。
    function lockAndSendNFT(uint256 tokenId, address newOwner, uint64 destChainSelector, address destReceiver) public returns (bytes32){
        // 将 NFT transferFrom 给本合约，实现锁仓。
        nft.transferFrom(msg.sender, address(this), tokenId);
        // 构造 payload：tokenId + newOwner
        bytes memory payload = abi.encode(tokenId, newOwner);
        // 发送 CCIP 消息，支付 LINK 费用
        bytes32 messageId = _sendMessagePayLINK(destChainSelector, destReceiver, payload);
        tokenLocked[tokenId] = true;
        return messageId;
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

    // 获取最后一条收到的消息 ID 和文本
    function getLastReceivedMessageDetails() external view returns (bytes32 messageId, string memory text){
        return (s_lastReceivedMessageId, s_lastReceivedText);
    }

    function allowlistDestinationChain(uint64 _destinationChainSelector,bool allowed) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    function allowlistSourceChain(uint64 _sourceChainSelector,bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    // 跨链接收消息并释放 NFT
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage)internal override{
        s_lastReceivedMessageId = any2EvmMessage.messageId;
        // 解码 payload 得到 tokenId 和 newOwner
        RequestData memory requestData = abi.decode(any2EvmMessage.data, (RequestData));
        uint256 tokenId = requestData.tokenId;
        address newOwner = requestData.newOwner;
        // 确认该 NFT 是锁定状态
        require(tokenLocked[tokenId], "the NFT is not locked");
        // 合约将 NFT transferFrom 自己转给 newOwner
        nft.transferFrom(address(this), newOwner, tokenId);
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