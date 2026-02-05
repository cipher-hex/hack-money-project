// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SafePay is ReentrancyGuard {
    enum TransactionStatus { Pending, Claimed, Refunded }

    struct Transaction {
        address sender_address;
        address recipient_address;
        uint256 amount;
        uint256 timestamp;
        TransactionStatus status;
        string note;
        address tokenAddress; // address(0) for native currency, token contract address for ERC-20
        bool isNative; // true for native currency (ETH), false for ERC-20 tokens
    }

    struct User {
        string userId;
        bytes32[] transactionIds;
    }

    mapping(bytes32 => Transaction) public transactions;
    mapping(address => User) public users;
    mapping(string => address) public usernameToWalletAddress;
    mapping(address => bytes32[]) public pendingTransactionsBySender_address;

    // Events
    event UserRegistered(address indexed userAddress, string userId);
    
    event TransactionInitiated(
        bytes32 indexed transactionId, 
        address indexed sender_address, 
        address indexed recipient_address, 
        uint256 amount,
        string note
    );
    event TransactionClaimed(
        bytes32 indexed transactionId, 
        address indexed recipient_address, uint256 amount);
    event TransactionRefunded(bytes32 indexed transactionId, 
    address indexed sender_address,
     uint256 amount);

    // Username Registration and Basic Transfer Functions
    function registerUserId(string memory _userId) external {
        require(bytes(_userId).length > 0, "UserId cannot be empty");
        require(bytes(users[msg.sender].userId).length == 0, "User already registered");
        require(usernameToWalletAddress[_userId] == address(0), "UserId already taken");

        users[msg.sender].userId = _userId;
        usernameToWalletAddress[_userId] = msg.sender;

        emit UserRegistered(msg.sender, _userId);
    }

    function sendToWalletAddress(address _recipient_address, string memory _note) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_recipient_address != address(0), "Invalid recipient address");

        _initiateTransaction(_recipient_address, _note);
    }

    function sendToUserId(string memory _userId, string memory _note) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        address recipientAddress = usernameToWalletAddress[_userId];
        require(recipientAddress != address(0), "UserId not found");

        _initiateTransaction(recipientAddress, _note);
    }

    function _initiateTransaction(address _recipient_address, string memory _note) private {
        bytes32 transactionId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient_address,
            msg.value,
            block.timestamp
        ));

        transactions[transactionId] = Transaction({
            sender_address: msg.sender,
            recipient_address: _recipient_address,
            amount: msg.value,
            timestamp: block.timestamp,
            status: TransactionStatus.Pending,
            note: _note,
            tokenAddress: address(0), // Native currency
            isNative: true // This is a native currency transaction
        });

        users[msg.sender].transactionIds.push(transactionId);
        pendingTransactionsBySender_address[msg.sender].push(transactionId);

        emit TransactionInitiated(transactionId, msg.sender, _recipient_address, msg.value, _note);
    }

    function claimTransaction(bytes32 _transactionId) internal {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.recipient_address == msg.sender, "You are not the intended recipient");
        require(transaction.status == TransactionStatus.Pending, "Transaction is not claimable");
        require(transaction.isNative, "Use claimERC20Transaction for ERC-20 tokens");

        transaction.status = TransactionStatus.Claimed;
        payable(msg.sender).transfer(transaction.amount);

        if (bytes(users[msg.sender].userId).length > 0) {
            users[msg.sender].transactionIds.push(_transactionId);
        }

        removePendingTransaction(transaction.sender_address, _transactionId);
        emit TransactionClaimed(_transactionId, msg.sender, transaction.amount);
    }


    function claimTransactionById(bytes32 _transactionId) external nonReentrant {
        claimTransaction(_transactionId);
    }

    function removePendingTransaction(address _sender_address, bytes32 _transactionId) internal {
        bytes32[] storage pendingTransactions = pendingTransactionsBySender_address[_sender_address];
        for (uint i = 0; i < pendingTransactions.length; i++) {
            if (pendingTransactions[i] == _transactionId) {
                pendingTransactions[i] = pendingTransactions[pendingTransactions.length - 1];
                pendingTransactions.pop();
                break;
            }
        }
    }

    function refundTransaction(bytes32 _transactionId) external nonReentrant {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.sender_address == msg.sender, "You are not the sender");
        require(transaction.status == TransactionStatus.Pending, "Transaction is not refundable");
        require(transaction.isNative, "Use refundERC20Transaction for ERC-20 tokens");

        transaction.status = TransactionStatus.Refunded;
        payable(msg.sender).transfer(transaction.amount);

        removePendingTransaction(msg.sender, _transactionId);
        emit TransactionRefunded(_transactionId, msg.sender, transaction.amount);
    }

    // ====================================
    // ERC-20 TOKEN SUPPORT FUNCTIONS
    // ====================================

    function sendERC20ToWalletAddress(
        address _tokenAddress, 
        address _recipient_address, 
        uint256 _amount, 
        string memory _note
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_recipient_address != address(0), "Invalid recipient address");
        require(_tokenAddress != address(0), "Invalid token address");

        IERC20 token = IERC20(_tokenAddress);
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        _initiateERC20Transaction(_tokenAddress, _recipient_address, _amount, _note);
    }

    function sendERC20ToUserId(
        address _tokenAddress,
        string memory _userId, 
        uint256 _amount, 
        string memory _note
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_tokenAddress != address(0), "Invalid token address");
        address recipientAddress = usernameToWalletAddress[_userId];
        require(recipientAddress != address(0), "UserId not found");

        IERC20 token = IERC20(_tokenAddress);
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        _initiateERC20Transaction(_tokenAddress, recipientAddress, _amount, _note);
    }

    function claimERC20Transaction(bytes32 _transactionId) external nonReentrant {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.recipient_address == msg.sender, "You are not the intended recipient");
        require(transaction.status == TransactionStatus.Pending, "Transaction is not claimable");
        require(!transaction.isNative, "Use claimTransaction for native currency");

        transaction.status = TransactionStatus.Claimed;
        IERC20 token = IERC20(transaction.tokenAddress);
        require(token.transfer(msg.sender, transaction.amount), "Token transfer failed");

        if (bytes(users[msg.sender].userId).length > 0) {
            users[msg.sender].transactionIds.push(_transactionId);
        }

        removePendingTransaction(transaction.sender_address, _transactionId);
        emit TransactionClaimed(_transactionId, msg.sender, transaction.amount);
    }

    function refundERC20Transaction(bytes32 _transactionId) external nonReentrant {
        Transaction storage transaction = transactions[_transactionId];
        require(transaction.sender_address == msg.sender, "You are not the sender");
        require(transaction.status == TransactionStatus.Pending, "Transaction is not refundable");
        require(!transaction.isNative, "Use refundTransaction for native currency");

        transaction.status = TransactionStatus.Refunded;
        IERC20 token = IERC20(transaction.tokenAddress);
        require(token.transfer(msg.sender, transaction.amount), "Token transfer failed");

        removePendingTransaction(msg.sender, _transactionId);
        emit TransactionRefunded(_transactionId, msg.sender, transaction.amount);
    }

    // ====================================
    // INTERNAL HELPER FUNCTIONS
    // ====================================

    function _initiateERC20Transaction(
        address _tokenAddress,
        address _recipient_address, 
        uint256 _amount,
        string memory _note
    ) private {
        bytes32 transactionId = keccak256(abi.encodePacked(
            msg.sender,
            _recipient_address,
            _tokenAddress,
            _amount,
            block.timestamp
        ));

        transactions[transactionId] = Transaction({
            sender_address: msg.sender,
            recipient_address: _recipient_address,
            amount: _amount,
            timestamp: block.timestamp,
            status: TransactionStatus.Pending,
            note: _note,
            tokenAddress: _tokenAddress,
            isNative: false
        });

        users[msg.sender].transactionIds.push(transactionId);
        pendingTransactionsBySender_address[msg.sender].push(transactionId);

        emit TransactionInitiated(transactionId, msg.sender, _recipient_address, _amount, _note);
    }

    // ====================================
    // GETTER FUNCTIONS
    // ====================================
    function getUserTransactions(address _userAddress) external view returns (Transaction[] memory) {
        bytes32[] memory userTransactionIds = users[_userAddress].transactionIds;
        Transaction[] memory userTransactions = new Transaction[](userTransactionIds.length);

        for (uint i = 0; i < userTransactionIds.length; i++) {
            userTransactions[i] = transactions[userTransactionIds[i]];
        }

        return userTransactions;
    }

    function getTransactionDetails(bytes32 _transactionId) external view returns (
        bytes32 transactionId,
        address sender_address,
        address recipient_address,
        uint256 amount,
        uint256 timestamp,
        TransactionStatus status,
        string memory note,
        address tokenAddress,
        bool isNative
    ) {
        Transaction storage transaction = transactions[_transactionId];
        return (
            _transactionId,
            transaction.sender_address,
            transaction.recipient_address,
            transaction.amount,
            transaction.timestamp,
            transaction.status,
            transaction.note,
            transaction.tokenAddress,
            transaction.isNative
        );
    }

    function getUserByUserId(string memory _userId) external view returns (address) {
        return usernameToWalletAddress[_userId];
    }

    function getUserByAddress(address _userAddress) external view returns (string memory) {
        return users[_userAddress].userId;
    }

    function getUserProfile(address _userAddress) external view returns (
        string memory userId,
        bytes32[] memory transactionIds
    ) {
        User storage user = users[_userAddress];
        return (
            user.userId,
            user.transactionIds
        );
    }


    function getPendingTransactions(address _sender_address) external view returns (bytes32[] memory) {
        return pendingTransactionsBySender_address[_sender_address];
    }
}