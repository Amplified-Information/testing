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

    address owner;

    string public statement;
    bool public outcome; // true = YES wins, false = NO wins
    uint256 public resolutionTime;
    uint256 public totalCollateral;
    
    mapping(address => uint256) public yesTokens;
    mapping(address => uint256) public noTokens;
    mapping(address => bool) public associatedTokens;
    
    event PositionTokensPurchased(address indexed buyer, uint256 amount, uint256 nPositionTokens, bool isSell);
    event MarketResolved(bool outcome);
    event WinningsRedeemed(address indexed user, uint256 amount);
    event TokenAssociated(address indexed token);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only direct user calls are allowed for this function");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == owner /* TODO - change to Oracle address */, "Only oracle can call this function");
        _;
    }

    constructor(address _collateralToken, string memory _statement) {
        collateralToken = IERC20(_collateralToken);
        statement = _statement;

        owner = msg.sender;

        resolutionTime = 0;
    }

    // must be atomic - what if the buyer or seller removes their USDC allowance?
    // moved the yes/no/isSell logic to the API
    // TODO - verify sigs?
    function buyPositionTokensOnBehalfAtomic(address yes, address no, uint256 collateralUSDC, uint256 nPositionTokens) external onlyOwner {
        require(resolutionTime == 0, "Market resolved");
        // require(block.timestamp < resolutionTime, "Market expired");

        // Transfer collateral from the buyer to the contract using the buyer's allowance
        // The buyer must have approved this contract (not msg.sender) to spend their tokens
        // IERC20(usdcAddress).transferFrom(owner, recipient, amount);
        // HederaTokenService.transferToken(token, from, to, amount);
        require(collateralToken.transferFrom(yes, address(this), collateralUSDC), "Transfer failed");
        require(collateralToken.transferFrom(no, address(this), collateralUSDC), "Transfer failed");
        
        yesTokens[yes] += nPositionTokens;
        noTokens[no] += nPositionTokens;
        
        totalCollateral += collateralUSDC;

        emit PositionTokensPurchased(yes, collateralUSDC / 2, nPositionTokens, false);
        emit PositionTokensPurchased(no, collateralUSDC / 2, nPositionTokens, true);

    }
    
    // Resolve market using Chainlink oracle
    function resolveMarket(bool noYes) external onlyOracle {
        require(resolutionTime == 0, "Already resolved");

        outcome = noYes;
        resolutionTime = block.timestamp;
        

        emit MarketResolved(noYes);
    }
    
    // Redeem winning tokens for collateral
    // Only user (msg.sender) can access their winnings
    function redeem() external returns (uint256 amountUSDC) {
        require(resolutionTime > 0, "Not resolved yet");
        
        uint256 nTokens = outcome ? yesTokens[msg.sender] : noTokens[msg.sender];
        require(nTokens > 0, "No winning tokens");

        // TODO - 2% profit redeem fee...
        // TODO - 1% profit fee for the market makers - TODO: how do we keep track of market makers?
        
        // Transfer collateral 1:1
        collateralToken.transfer(msg.sender, nTokens);

        // Clear balances
        if (yesTokens[msg.sender] > 0 ) yesTokens[msg.sender] = 0;
        if (noTokens[msg.sender] > 0 ) noTokens[msg.sender] = 0;

        // don't forget to reduce totalCollateral
        totalCollateral = totalCollateral - nTokens;
        
        emit WinningsRedeemed(msg.sender, nTokens);

        return nTokens; // nTokens === amountUSDC (1:1 mapping)
    }
    
    function getUserTokens(address user) external view returns (uint256 yes, uint256 no) {
        return (yesTokens[user], noTokens[user]);
    }

    function getTotalCollateral() external view returns (uint256) {
        return totalCollateral;
    }

    function associateToken(address tokenAddress) external onlyOwner {
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
