// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IronicPol is ERC20, AutomationCompatibleInterface{

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
    }

    struct Reserve{
        address token;
        uint decimal;
    }
    
    address public constant COP_W_Reserves = 0x85F14a8F5B3Bf49C49882287FB386d809ee8944a; // COPW Proof of Reserves
    address public constant USDFB_Reserves = 0xa191606c0411567aF77E9c55F34d5f916eaDd10B; // USDFB Proof of reserves
    address public constant CCIP_BNM = 0xcab0EF91Bee323d1A617c0a027eE753aFd6997E4; // ccip-bnm token on avalanche fuji testnet
    AggregatorV3Interface internal reserveFeed;
    address public owner;
    mapping(address => Portfolio) public userPortfolio;
    mapping(string => Reserve) public crosschainTokens;
    Position[] private user_positions;
    mapping(string => address) public CCTokenMaps;
    mapping(string => bool) internal active_reserve;

    uint256 public counter;
    /**
     * Use an interval in seconds and a timestamp to slow execution of Upkeep
     */
    uint256 public immutable interval;
    uint256 public lastTimeStamp;

    constructor(uint256 initialSupply, uint256 updateInterval) ERC20("Ironic", "IRN") {
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        counter = 0;

        reserveFeed = AggregatorV3Interface(COP_W_Reserves);
        active_reserve["copw"] = true;
        _mint(address(this), initialSupply);
        Reserve memory reserve = Reserve(COP_W_Reserves, 8);
        crosschainTokens["ccip-bnm"] = reserve;
        CCTokenMaps["ccip-bnm"] = CCIP_BNM;
        owner = msg.sender;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    function changeReserveFeed() public onlyOwner {
        if(active_reserve["copw"]){
            reserveFeed = AggregatorV3Interface(USDFB_Reserves);
            active_reserve["usdfb"] = true;
            active_reserve["copw"] = false;
            Reserve memory reserve = Reserve(USDFB_Reserves, 8);
            crosschainTokens["ccip-bnm"] = reserve;
        } else{
            reserveFeed = AggregatorV3Interface(COP_W_Reserves);
            active_reserve["copw"] = true;
            active_reserve["usdfb"] = false;
            Reserve memory reserve = Reserve(COP_W_Reserves, 8);
            crosschainTokens["ccip-bnm"] = reserve;
        }
    }

    modifier balanceCheck(uint256 amount, string memory token_name) {
        require(amount > 0, "amount is not valid");
        require(crosschainTokens[token_name].token != address(0), "token name doesnt exist");
        require(
        IERC20(crosschainTokens[token_name].token).balanceOf(address(this)) >= amount,
        "Insufficient contract token balance");
        _;
    }

    modifier checkWithdrawal(address user, uint256 amount, string memory token_name){
        require(amount > 0, "amount is not valid");
        require(crosschainTokens[token_name].token != address(0), "token name doesnt exist");
        require(userPortfolio[user].allowedwithdrawalTimestamp > block.timestamp , "User is not allowed to withdraw within the freezing period");
        _;
    }

    function convertToMintAmount(
        int256 depositAmount,        // 18 decimals
        int256 reservePrice,          // 8 decimals (e.g., from getReserveData)
        string memory token_name
    ) public view returns (int256) {
        // Since reservePrice is 8 decimals, we need to scale it to 18 decimals
        // So: depositAmount * reservePrice / 1e(number of decimals) keeps the result in 18 decimals
        return (depositAmount * reservePrice) / int256(10**crosschainTokens[token_name].decimal);
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

    function getIronBalance(string memory token_name, address user) public view returns(uint256){
        return IERC20(crosschainTokens[token_name].token).balanceOf(user);
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
        for(uint256 i =0; i<user_positions.length; i++){
            uint256 data = uint256(getLatestReserve());
            if(user_positions[i].isActive && user_positions[i].stopLossThreshold <= data){
                flag = true;
            }
        }
        upkeepNeeded = flag;
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            for(uint256 i =0; i<user_positions.length; i++){
                uint256 data = uint256(getLatestReserve());
                if(user_positions[i].isActive && user_positions[i].stopLossThreshold <= data){
                    user_positions[i].isActive = false;
                    withdraw(user_positions[i].tokenDeposited, user_positions[i].amount);
                }
            }
        }  
    }

    function deposit(string memory token_name, uint256 amount) external balanceCheck(amount, token_name) {
        address token = crosschainTokens[token_name].token;
        userPortfolio[msg.sender].tokenDeposited = token;
        userPortfolio[msg.sender].allowedwithdrawalTimestamp = block.timestamp + 1 hours;
        require(IERC20(token).transfer(address(this), amount), "Transfer failed");
        int256 newAmount = int256(amount);
        int256 mintAmount = convertToMintAmount(newAmount, getLatestReserve(), token_name);
        uint256 mintAmountUint256 = uint256(mintAmount);
        userPortfolio[msg.sender].ironBalance += mintAmountUint256;
        userPortfolio[msg.sender].tokenDeposited = CCTokenMaps[token_name];
        _mint(msg.sender, mintAmountUint256);
    }

    function depositStopLoss(string memory token_name, uint256 amount, uint256 stop_loss_threshold) external balanceCheck(amount, token_name){
        uint256 currentPrice = uint256(getLatestReserve());
        require(currentPrice > stop_loss_threshold, "Stop loss triggered - price too low");
        address token = crosschainTokens[token_name].token;
        userPortfolio[msg.sender].tokenDeposited = token;
        userPortfolio[msg.sender].allowedwithdrawalTimestamp = block.timestamp + 1 hours;
        require(IERC20(token).transfer(address(this), amount), "Transfer failed");
        int256 newAmount = int256(amount);
        int256 mintAmount = convertToMintAmount(newAmount, getLatestReserve(), token_name);
        uint256 mintAmountUint256 = uint256(mintAmount);
        _mint(msg.sender, mintAmountUint256);
        userPortfolio[msg.sender].ironBalance += mintAmountUint256;
        userPortfolio[msg.sender].tokenDeposited = CCTokenMaps[token_name];

        user_positions.push(Position(amount, token_name, stop_loss_threshold, true));
    }

    function withdraw(string memory token_name, uint256 amount) public checkWithdrawal(msg.sender, amount, token_name) {
        address token = userPortfolio[msg.sender].tokenDeposited;
        require(IERC20(token).transfer(address(this), amount), "Transfer failed");
        uint256 balance = uint256(userPortfolio[msg.sender].ironBalance);
        require (balance >= amount , "Insufficient token balance to withdraw");
        require(IERC20(token).transferFrom(address(this), msg.sender, amount), "Transfer failed");
        userPortfolio[msg.sender].ironBalance -= amount;
        userPortfolio[msg.sender].withdrawn += amount;
        userPortfolio[msg.sender].allowedwithdrawalTimestamp = block.timestamp + 1 hours;
    }

    function getAllUserPositions() public view returns(Position[] memory){
        return user_positions;
    }


}