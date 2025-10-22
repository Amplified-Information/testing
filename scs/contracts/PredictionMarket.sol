// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Simple Hedera Token Service (HTS) precompile interface (testnet/mainnet share the same precompile)
interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int64);
}

contract PredictionMarket {
    // USDC on Hedera Mainnet: 0x000000000000000000000000000000000006f89a
    // USDC on Hedera Testnet: 0x0000000000000000000000000000000000068cda // 0.0.5449
    IERC20 public immutable collateralToken;

    address constant HTS_PRECOMPILE = address(0x167);

    string public statement;
    // uint256 public resolutionTime;
    
    // Token balances: user => (yesTokens, noTokens)
    mapping(address => uint256) public yesTokens;
    mapping(address => uint256) public noTokens;
    mapping(address => bool) public associatedTokens;
    
    // Market state
    bool public resolved;
    bool public outcome; // true = YES wins, false = NO wins
    uint256 public totalCollateral;
    
    event SharesPurchased(address indexed buyer, uint256 amount);
    event MarketResolved(bool outcome);
    event WinningsRedeemed(address indexed user, uint256 amount);
    event TokenAssociated(address indexed token);

    constructor(address _collateralToken, string memory _statement/*, uint256 _resolutionTime*/) {
        collateralToken = IERC20(_collateralToken);
        statement = _statement;
        // resolutionTime = _resolutionTime;
    }
    
    // Buy equal amounts of YES and NO tokens with collateral (1:1:1 ratio)
    function buyShares(uint256 amount/* TODO , string signature*/) external {
        require(!resolved, "Market resolved");
        // require(block.timestamp < resolutionTime, "Market expired");

        // TODO - 1% trading fee?
        // TODO - how to incentivize market makers? Give them predict token...
        
        
        collateralToken.transferFrom(msg.sender, address(this), amount);
        
        yesTokens[msg.sender] += amount;
        noTokens[msg.sender] += amount;
        totalCollateral += amount;

        emit SharesPurchased(msg.sender, amount);
    }
    
    // Resolve market using Chainlink oracle
    function resolveWithChainlink() external { 
        require(!resolved, "Already resolved");
        // require(block.timestamp >= resolutionTime, "Too early to resolve");

        // TODO: Add Chainlink oracle request and resolution logic here
        resolved = true;
    }
    
    // Redeem winning tokens for collateral
    function redeem() external {
        require(resolved, "Not resolved yet");
        
        uint256 winningTokens = outcome ? yesTokens[msg.sender] : noTokens[msg.sender];
        require(winningTokens > 0, "No winning tokens");
        
        // Clear balances
        yesTokens[msg.sender] = 0;
        noTokens[msg.sender] = 0;

        // TODO - 2% profit redeem fee...
        // TODO - 1% profit fee for the market makers - TODO: how do we keep track of market makers?
        
        // Transfer collateral 1:1
        collateralToken.transfer(msg.sender, winningTokens);
        
        emit WinningsRedeemed(msg.sender, winningTokens);
    }
    
    // View functions
    function getUserTokens(address user) external view returns (uint256 yes, uint256 no) {
        return (yesTokens[user], noTokens[user]);
    }

    // function associateToken(address tokenAddress) external {
    //     // Only allow associating the market contract itself
    //     // (caller can be any account that wants this contract to be associated with the token)
    //     IHederaTokenService hts = IHederaTokenService(address(0x167)); // HTS precompile address
    //     int64 response = hts.associateToken(address(this), tokenAddress);
    //     require(response == 0, "HTS associate failed");
    //     associatedTokens[tokenAddress] = true;
    //     emit TokenAssociated(tokenAddress);
    // }

    function associateToken(address tokenAddress) external { // TODO onlyowner
        (bool success, bytes memory result) = HTS_PRECOMPILE.call(
            abi.encodeWithSelector(
                bytes4(keccak256("associateToken(address,address)")),
                address(this),
                tokenAddress
            )
        );
        require(success, "HTS call failed");
        int64 responseCode = abi.decode(result, (int64));
        require(responseCode == 22, "Association not successful");

        associatedTokens[tokenAddress] = true;
        emit TokenAssociated(tokenAddress);
    }
}
