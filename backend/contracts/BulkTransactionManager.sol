// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BulkTransactionManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Structs
    struct Recipient {
        address walletAddress;
        string relation;
        string fullName;
        string userId;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct BulkTransaction {
        address sender;
        address tokenAddress; // address(0) for native token
        uint256 totalAmount;
        uint256 recipientCount;
        uint256 timestamp;
        bool isNative;
    }

    // State variables
    mapping(address => Recipient[]) private userRecipients;
    mapping(address => BulkTransaction[]) private userTransactionHistory;
    mapping(address => uint256) private userRecipientCount;
    
    uint256 public constant MAX_RECIPIENTS_PER_TX = 50;

    // Events
    event RecipientAdded(address indexed sender, uint256 recipientId, address walletAddress);
    event RecipientUpdated(address indexed sender, uint256 recipientId);
    event RecipientDeleted(address indexed sender, uint256 recipientId);
    event BulkTransferCompleted(
        address indexed sender,
        uint256 recipientCount,
        uint256 totalAmount,
        address tokenAddress
    );

    constructor() Ownable(msg.sender) {}

    // NOTE: Recipient ID validation relaxed – functions now handle invalid IDs gracefully without reverting.

    // Recipient Management Functions
    function addRecipient(
        address _walletAddress,
        string memory _relation,
        string memory _fullName,
        string memory _userId
    ) external {
        require(_walletAddress != address(0), "Invalid wallet address");
        require(bytes(_fullName).length > 0, "Full name is required");
        require(bytes(_relation).length > 0, "Relation is required");
        
        // Check for duplicate address
        Recipient[] storage recipients = userRecipients[msg.sender];
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i].isActive && recipients[i].walletAddress == _walletAddress) {
                revert("Recipient already exists");
            }
        }

        recipients.push(Recipient({
            walletAddress: _walletAddress,
            relation: _relation,
            fullName: _fullName,
            userId: _userId,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        }));

        userRecipientCount[msg.sender]++;
        emit RecipientAdded(msg.sender, recipients.length - 1, _walletAddress);
    }

    function updateRecipient(
        uint256 _recipientId,
        address _walletAddress,
        string memory _relation,
        string memory _fullName,
        string memory _userId
    ) external {
        require(_recipientId < userRecipients[msg.sender].length, "Invalid recipient ID");
        require(userRecipients[msg.sender][_recipientId].isActive, "Recipient not active");
        require(_walletAddress != address(0), "Invalid wallet address");
        require(bytes(_fullName).length > 0, "Full name is required");
        require(bytes(_relation).length > 0, "Relation is required");

        Recipient storage recipient = userRecipients[msg.sender][_recipientId];
        recipient.walletAddress = _walletAddress;
        recipient.relation = _relation;
        recipient.fullName = _fullName;
        recipient.userId = _userId;
        recipient.updatedAt = block.timestamp;

        emit RecipientUpdated(msg.sender, _recipientId);
    }

    function deleteRecipient(uint256 _recipientId) external {
        require(_recipientId < userRecipients[msg.sender].length, "Invalid recipient ID");
        require(userRecipients[msg.sender][_recipientId].isActive, "Recipient already inactive");
        
        userRecipients[msg.sender][_recipientId].isActive = false;
        userRecipientCount[msg.sender]--;
        emit RecipientDeleted(msg.sender, _recipientId);
    }

    // Bulk Transfer Functions
    function bulkTransferNative(
        uint256[] calldata _recipientIds,
        uint256[] calldata _amounts
    ) external payable nonReentrant {
        require(_recipientIds.length == _amounts.length, "Arrays length mismatch");
        require(_recipientIds.length > 0 && _recipientIds.length <= MAX_RECIPIENTS_PER_TX, "Invalid recipient count");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Amount must be greater than 0");
            totalAmount += _amounts[i];
        }

        require(msg.value >= totalAmount, "Insufficient native token sent");

        // Transfer to recipients and track actual amount transferred
        uint256 actualTransferred = 0;
        uint256 successfulTransfers = 0;
        
        for (uint256 i = 0; i < _recipientIds.length; i++) {
            if (_recipientIds[i] >= userRecipients[msg.sender].length) {
                continue; // skip invalid id
            }
            if (!userRecipients[msg.sender][_recipientIds[i]].isActive) {
                continue; // skip inactive
            }
            
            address recipient = userRecipients[msg.sender][_recipientIds[i]].walletAddress;
            require(recipient != address(0), "Invalid recipient address");
            
            (bool success, ) = recipient.call{value: _amounts[i]}("");
            require(success, "Native token transfer failed");
            
            actualTransferred += _amounts[i];
            successfulTransfers++;
        }

        require(successfulTransfers > 0, "No valid recipients found");

        // Record transaction with actual transferred amount
        userTransactionHistory[msg.sender].push(BulkTransaction({
            sender: msg.sender,
            tokenAddress: address(0),
            totalAmount: actualTransferred,
            recipientCount: successfulTransfers,
            timestamp: block.timestamp,
            isNative: true
        }));

        emit BulkTransferCompleted(msg.sender, successfulTransfers, actualTransferred, address(0));

        // Refund any unused amount
        uint256 refundAmount = msg.value - actualTransferred;
        if (refundAmount > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: refundAmount}("");
            require(refundSuccess, "Refund failed");
        }
    }

    function bulkTransferERC20(
        address _tokenAddress,
        uint256[] calldata _recipientIds,
        uint256[] calldata _amounts
    ) external nonReentrant {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_recipientIds.length == _amounts.length, "Arrays length mismatch");
        require(_recipientIds.length > 0 && _recipientIds.length <= MAX_RECIPIENTS_PER_TX, "Invalid recipient count");

        IERC20 token = IERC20(_tokenAddress);
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Amount must be greater than 0");
            totalAmount += _amounts[i];
        }

        // Check allowance
        require(token.allowance(msg.sender, address(this)) >= totalAmount, "Insufficient allowance");
        require(token.balanceOf(msg.sender) >= totalAmount, "Insufficient token balance");

        // Transfer to recipients and track actual amount transferred
        uint256 actualTransferred = 0;
        uint256 successfulTransfers = 0;
        
        for (uint256 i = 0; i < _recipientIds.length; i++) {
            if (_recipientIds[i] >= userRecipients[msg.sender].length) {
                continue; // skip invalid id
            }
            if (!userRecipients[msg.sender][_recipientIds[i]].isActive) {
                continue; // skip inactive
            }
            
            address recipient = userRecipients[msg.sender][_recipientIds[i]].walletAddress;
            require(recipient != address(0), "Invalid recipient address");
            
            token.safeTransferFrom(msg.sender, recipient, _amounts[i]);
            actualTransferred += _amounts[i];
            successfulTransfers++;
        }

        require(successfulTransfers > 0, "No valid recipients found");

        // Record transaction with actual transferred amount
        userTransactionHistory[msg.sender].push(BulkTransaction({
            sender: msg.sender,
            tokenAddress: _tokenAddress,
            totalAmount: actualTransferred,
            recipientCount: successfulTransfers,
            timestamp: block.timestamp,
            isNative: false
        }));

        emit BulkTransferCompleted(msg.sender, successfulTransfers, actualTransferred, _tokenAddress);
    }

    // View Functions
    function getRecipients(address _user) external view returns (Recipient[] memory) {
        Recipient[] storage allRecipients = userRecipients[_user];
        uint256 activeCount = 0;

        // Count active recipients
        for (uint256 i = 0; i < allRecipients.length; i++) {
            if (allRecipients[i].isActive) {
                activeCount++;
            }
        }

        // Create array with only active recipients
        Recipient[] memory activeRecipients = new Recipient[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allRecipients.length; i++) {
            if (allRecipients[i].isActive) {
                activeRecipients[index] = allRecipients[i];
                index++;
            }
        }

        return activeRecipients;
    }

    function getAllRecipientsWithIds(address _user) external view returns (
        Recipient[] memory recipients,
        uint256[] memory ids
    ) {
        Recipient[] storage allRecipients = userRecipients[_user];
        uint256 activeCount = 0;

        // Count active recipients
        for (uint256 i = 0; i < allRecipients.length; i++) {
            if (allRecipients[i].isActive) {
                activeCount++;
            }
        }

        recipients = new Recipient[](activeCount);
        ids = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allRecipients.length; i++) {
            if (allRecipients[i].isActive) {
                recipients[index] = allRecipients[i];
                ids[index] = i;
                index++;
            }
        }
    }

    function getRecipientCount(address _user) external view returns (uint256) {
        return userRecipientCount[_user];
    }

    function getTransactionHistory(address _user) external view returns (BulkTransaction[] memory) {
        return userTransactionHistory[_user];
    }
}
