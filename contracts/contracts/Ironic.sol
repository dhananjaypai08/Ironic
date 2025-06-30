// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Ironic is ERC20, AutomationCompatibleInterface{
    struct Portfolio{
        uint256 ironBalance;
        address tokenDeposited;
        uint256 withdrawn;
        uint256 allowedwithdrawalTimestamp;
    }

    struct Position{
        uint256 amount;
        string tokenDeposited;
        uint256 stopLossThreshold;
        bool isActive;
        address user; // Track which user owns this position
    }

    struct Reserve{
        address token;
        uint decimal;
    }
    
    address public constant BTC_B_Reserve = 0xa284e0aCB9a5F46CE7884D9929Fa573Ff842d7b3; // BTC.b Proof of Reserves
    address public constant CCIP_BNM = 0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4; // ccip-bnm token on avalanche fuji testnet
    AggregatorV3Interface internal reserveFeed;
    address public owner;
    mapping(address => Portfolio) public userPortfolio;
    mapping(string => Reserve) public crosschainTokens;
    Position[] private user_positions;
    mapping(string => address) public CCTokenMaps;

    uint256 public counter;
    uint256 public immutable interval;
    uint256 public lastTimeStamp;

    constructor(uint256 initialSupply, uint256 updateInterval) ERC20("Ironic", "IRN") {
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        counter = 0;

        reserveFeed = AggregatorV3Interface(BTC_B_Reserve);
        _mint(address(this), initialSupply);
        
        // FIX: Store CCIP_BNM token address (18 decimals), not oracle address
        Reserve memory ccip_bnm_reserve = Reserve(CCIP_BNM, 18);
        crosschainTokens["ccip-bnm"] = ccip_bnm_reserve;
        CCTokenMaps["ccip-bnm"] = CCIP_BNM;
        owner = msg.sender;
    }

    function convertToMintAmount(
        uint256 depositAmount, // raw token amount
        uint8 tokenDecimals,   // e.g., 18
        int256 reservePrice    // 8 decimals
    ) public pure returns (uint256) {
        // Scale: depositAmount * reservePrice / 10^8
        // First normalize deposit to 18 decimals
        uint256 scaledDeposit = depositAmount * (10 ** (18 - tokenDecimals));
        return (scaledDeposit * uint256(reservePrice)) / 10 ** 8;
    }

    function convertToWithdrawAmount(
        uint256 ironAmount,      // Amount of IRON tokens to redeem (18 decimals)
        uint8 tokenDecimals,     // Decimals of the output token, e.g., 18
        int256 reservePrice      // Reserve feed price (8 decimals)
    ) public pure returns (uint256) {
        require(reservePrice > 0, "Invalid reserve price");

        // Reverse of mint:
        // CCIP-BNM = (IRON * 10^8) / reservePrice
        // Then scale to tokenDecimals

        uint256 rawWithdraw = (ironAmount * 1e8) / uint256(reservePrice);
        return rawWithdraw / (10 ** (18 - tokenDecimals));  // Adjust back to original token decimals
    }


    // get latest proof of reserve data
    function getLatestReserve() public view returns (int) {
        (
            /*uint80 roundID*/,
            int256 reserve,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = reserveFeed.latestRoundData();

        return reserve;
    }

    // FIX: This should return the user's IRN balance, not underlying token balance
    function getIronBalance(address user) public view returns(uint256){
        return balanceOf(user); // Return IRN token balance
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool flag = false;
        uint256 currentPrice = uint256(getLatestReserve());
        
        for(uint256 i = 0; i < user_positions.length; i++){
            if(user_positions[i].isActive && user_positions[i].stopLossThreshold >= currentPrice){
                flag = true;
                break;
            }
        }
        upkeepNeeded = flag;
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            uint256 currentPrice = uint256(getLatestReserve());
            
            for(uint256 i = 0; i < user_positions.length; i++){
                if(user_positions[i].isActive && user_positions[i].stopLossThreshold >= currentPrice){
                    user_positions[i].isActive = false;
                    // Trigger withdrawal for the position owner
                    _triggerStopLoss(i);
                }
            }
        }  
    }

    // Internal function to handle stop-loss withdrawals
    function _triggerStopLoss(uint256 positionIndex) internal {
        Position storage position = user_positions[positionIndex];
        address positionOwner = position.user;
        
        // Calculate how much IRN to burn based on original deposit
        uint256 ironAmount = position.amount; // This should be the IRN amount, not underlying
        
        // Check if user has enough IRN tokens
        if (balanceOf(positionOwner) >= ironAmount) {
            _burn(positionOwner, ironAmount);
            
            // Transfer underlying tokens back
            address token = crosschainTokens[position.tokenDeposited].token;
            uint8 tokenDecimals = uint8(crosschainTokens["ccip-bnm"].decimal);
            uint256 outputAmount = convertToWithdrawAmount(ironAmount, tokenDecimals, getLatestReserve());
            if (IERC20(token).balanceOf(address(this)) >= outputAmount) {
                IERC20(token).transfer(positionOwner, outputAmount);
                
                // Update user portfolio
                userPortfolio[positionOwner].ironBalance -= ironAmount;
                userPortfolio[positionOwner].withdrawn += outputAmount;
            }
        }
    }

    function nativeBalance() public view returns(uint256){
        return IERC20(CCIP_BNM).balanceOf(msg.sender);
    }

    function checkApprovalCCToken() public view returns(uint256){
        return IERC20(CCIP_BNM).allowance(msg.sender, address(this));
    }

    function approveCCToken(uint256 amount) external returns(bool){
        bool success = IERC20(CCIP_BNM).approve(address(this), amount);
        return success;
    }

    function deposit(string memory token_name, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Use the consistent token mapping
        address token = CCIP_BNM;
        
        // Check allowance and balance
        require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        require(IERC20(token).balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update user portfolio
        userPortfolio[msg.sender].tokenDeposited = token;
        userPortfolio[msg.sender].allowedwithdrawalTimestamp = block.timestamp + 1 hours;
        
        // Calculate how many IRN tokens to mint
        uint8 tokenDecimals = uint8(crosschainTokens[token_name].decimal);
        uint256 mintAmount = convertToMintAmount(amount, tokenDecimals, getLatestReserve());

        require(mintAmount > 0, "Invalid mint amount calculated");
        
        uint256 mintAmountUint256 = uint256(mintAmount);
        userPortfolio[msg.sender].ironBalance += mintAmountUint256;
        
        // Mint IRN tokens to user
        _mint(msg.sender, mintAmountUint256);
    }

    function depositStopLoss(string memory token_name, uint256 amount, uint256 stop_loss_threshold) external {
        require(amount > 0, "Amount must be greater than 0");
        require(crosschainTokens[token_name].token != address(0), "Token not supported");
        
        uint256 currentPrice = uint256(getLatestReserve());
        require(currentPrice > stop_loss_threshold, "Stop loss threshold too high");
        
        address token = CCTokenMaps[token_name];
        
        // Check allowance and balance
        require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        require(IERC20(token).balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Transfer tokens from user to contract
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update user portfolio
        userPortfolio[msg.sender].tokenDeposited = token;
        userPortfolio[msg.sender].allowedwithdrawalTimestamp = block.timestamp + 1 hours;
        
        // Calculate how many IRN tokens to mint
        uint8 tokenDecimals = uint8(crosschainTokens[token_name].decimal);
        uint256 mintAmount = convertToMintAmount(amount, tokenDecimals, getLatestReserve());

        require(mintAmount > 0, "Invalid mint amount calculated");
        
        uint256 mintAmountUint256 = uint256(mintAmount);
        
        // Mint IRN tokens to user
        _mint(msg.sender, mintAmountUint256);
        userPortfolio[msg.sender].ironBalance += mintAmountUint256;

        // Create position with IRN amount for stop-loss tracking
        user_positions.push(Position({
            amount: mintAmountUint256, // Store IRN amount, not underlying amount
            tokenDeposited: token_name,
            stopLossThreshold: stop_loss_threshold,
            isActive: true,
            user: msg.sender
        }));
    }

    function withdraw(string memory token_name, uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        require(CCTokenMaps[token_name] != address(0), "Token not supported");
        require(userPortfolio[msg.sender].allowedwithdrawalTimestamp <= block.timestamp, "Withdrawal not yet allowed");
        
        uint256 balance = userPortfolio[msg.sender].ironBalance;
        require(balance >= amount, "Insufficient IRN balance");
        
        address token = CCTokenMaps[token_name];
        uint8 tokenDecimals = uint8(crosschainTokens[token_name].decimal);
        uint256 outputAmount = convertToWithdrawAmount(amount, tokenDecimals, getLatestReserve());
        
        // Check contract has enough underlying tokens
        require(IERC20(token).balanceOf(address(this)) >= outputAmount, "Insufficient contract balance");
        
        // Burn IRN tokens from user
        _burn(msg.sender, amount);
        
        // Transfer underlying tokens to user
        require(IERC20(token).transfer(msg.sender, outputAmount), "Transfer failed");
        
        // Update user portfolio
        userPortfolio[msg.sender].ironBalance -= amount;
        userPortfolio[msg.sender].withdrawn += amount;
        userPortfolio[msg.sender].allowedwithdrawalTimestamp = block.timestamp + 1 hours;
    }

    function getAllUserPositions() public view returns(Position[] memory){
        return user_positions;
    }

    // Helper function to get user's specific positions
    function getUserPositions(address user) public view returns(Position[] memory) {
        uint256 userPositionCount = 0;
        
        // Count user positions
        for(uint256 i = 0; i < user_positions.length; i++) {
            if(user_positions[i].user == user) {
                userPositionCount++;
            }
        }
        
        // Create array for user positions
        Position[] memory userPositions = new Position[](userPositionCount);
        uint256 index = 0;
        
        for(uint256 i = 0; i < user_positions.length; i++) {
            if(user_positions[i].user == user) {
                userPositions[index] = user_positions[i];
                index++;
            }
        }
        
        return userPositions;
    }

    // Emergency function to check contract state
    function getContractInfo() public view returns (
        address tokenAddress,
        uint256 contractTokenBalance,
        uint256 contractIRNBalance,
        int256 currentReservePrice
    ) {
        tokenAddress = CCTokenMaps["ccip-bnm"];
        contractTokenBalance = IERC20(tokenAddress).balanceOf(address(this));
        contractIRNBalance = balanceOf(address(this));
        currentReservePrice = getLatestReserve();
    }

    receive() external payable {}
}