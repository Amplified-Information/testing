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
    address constant HEDERA_PRECOMPILE = address(0x167);

    address owner;
    mapping(address => bool) public associatedTokens;

    mapping(uint128 => string) public statements;
    mapping(uint128 => bool) public outcomes;               // true = YES wins, false = NO wins
    mapping(uint128 => uint256) public resolutionTimes;
    mapping(uint128 => uint256) public totalCollaterals;
    
    mapping(uint128 => mapping(address => uint256)) public yesTokens;
    mapping(uint128 => mapping(address => uint256)) public noTokens;
    
    event PositionTokensPurchased(uint128 marketId, address indexed buyer, uint256 collateralUsd, bool isSell);
    event MarketResolved(uint128 marketId, bool outcome);
    event WinningsRedeemed(uint128 marketId, address indexed user, uint256 amount);
    event TokenAssociated(address indexed token);

    /**
    Only contract owner guard
    */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only direct user calls are allowed for this function");
        _;
    }

    /**
    Only Oracle guard
    */
    modifier onlyOracle() {
        require(msg.sender == owner /* TODO - change to Oracle address */, "Only oracle can call this function");
        _;
    }

    /**
    Smart contract contructor to initialize the PredictionMarket with the specified collateral token.
    @param _collateralToken The address of the ERC20 token to be used as collateral (e.g., USDC).
    */
    constructor(address _collateralToken) {
        collateralToken = IERC20(_collateralToken);
        owner = msg.sender;
    }

    /**
    Function to create a new prediction market with a unique market ID and statement.
    @param marketId The unique identifier for the new market.
    @param _statement The statement or question for the prediction market.
    */
    function createNewMarket(uint128 marketId, string memory _statement) external onlyOwner {
        require(keccak256(abi.encodePacked(statements[marketId])) == keccak256(abi.encodePacked("")), "Market already exists");
        statements[marketId] = _statement;
        resolutionTimes[marketId] = 0; // TODO - necessary? Can be removed?
        totalCollaterals[marketId] = 0; // TODO - necessary? Can be removed?
    }

    /**
    This function allows the CLOB to initiate the buying of YES and NO position tokens atomically on behalf of two accounts "yes" and "no".
    TODO - verify the signatures
    @param marketId The ID of the market.
    @param signerYes The (signing) address of the account buying YES position tokens.
    @param signerNo The (signing) address of the account buying NO position tokens.
    @param collateralUsdcAbs The amount of collateral (in USDC) to be used for purchasing position tokens.
    @param txIdYes The transaction ID for the YES position token purchase (for constructing sig payload)
    @param txIdNo The transaction ID for the NO position token purchase (for constructing sig payload)
    @param sigYes The signature of the YES position token purchase transaction.
    @param sigNo The signature of the NO position token purchase transaction.
    */
    function buyPositionTokensOnBehalfAtomic(uint128 marketId, address signerYes, address signerNo, uint256 collateralUsdcAbs, uint128 txIdYes, uint128 txIdNo, bytes calldata sigYes, bytes calldata sigNo) external onlyOwner {
        require(resolutionTimes[marketId] == 0, "Market resolved");

        // Calculate payload sigs on-chain
        bytes32 messageHashYes = calcSig(txIdYes, marketId, collateralUsdcAbs);
        bytes32 messageHashNo = calcSig(txIdNo, marketId, collateralUsdcAbs);

        // Validate signatures
        require(
            validateECDSASignature(signerYes, messageHashYes, sigYes) ||
            validateEd25519Signature(signerYes, messageHashYes, sigYes),
            "Invalid YES signature"
        );
        require(
            validateECDSASignature(signerNo, messageHashNo, sigNo) ||
            validateEd25519Signature(signerNo, messageHashNo, sigNo),
            "Invalid NO signature"
        );

        // Transfer collateral from the buyer to the contract using the buyer's allowance
        // The buyer must have approved this contract (not msg.sender) to spend their tokens
        // IERC20(usdcAddress).transferFrom(owner, recipient, amount);
        // HederaTokenService.transferToken(token, from, to, amount);
        require(collateralToken.transferFrom(signerYes, address(this), collateralUsdcAbs), "Transfer failed");
        require(collateralToken.transferFrom(signerNo, address(this), collateralUsdcAbs), "Transfer failed");
        
        yesTokens[marketId][signerYes] += collateralUsdcAbs; // 1:1 mapping of collateral to position tokens
        noTokens[marketId][signerNo] += collateralUsdcAbs; // 1:1 mapping of collateral to position tokens
        
        totalCollaterals[marketId] += collateralUsdcAbs;

        emit PositionTokensPurchased(marketId, signerYes, collateralUsdcAbs, false);
        emit PositionTokensPurchased(marketId, signerNo, collateralUsdcAbs, true);
    }
    
    /**
    This function allows the oracle to resolve the market by specifying the outcome (YES or NO).
    TODO - restrict to Oracle address
    @param marketId The ID of the market to be resolved.
    @param noYes A boolean indicating the outcome of the market: true for YES wins, false for NO wins.
    */
    function resolveMarket(uint128 marketId, bool noYes) external onlyOracle {
        require(resolutionTimes[marketId] == 0, "Already resolved");

        outcomes[marketId] = noYes;
        resolutionTimes[marketId] = block.timestamp;
       
        emit MarketResolved(marketId, noYes);
    }
    
    /**
    This function allows users to redeem their winning position tokens for collateral after the market has been resolved.
    A user (msg.sender) can only access their own winnings after the market is resolved
    @param marketId The ID of the market for which the user wants to redeem their winnings.
    @return amountUSDC The amount of collateral (in USDC) redeemed by the user
    */
    function redeem(uint128 marketId) external returns (uint256 amountUSDC) {
        require(resolutionTimes[marketId] > 0, "Not resolved yet");
        
        uint256 nTokens = outcomes[marketId] ? yesTokens[marketId][msg.sender] : noTokens[marketId][msg.sender];
        require(nTokens > 0, "No winning tokens");

        // TODO - 2% profit redeem fee...
        // TODO - 1% profit fee for the market makers - TODO: how do we keep track of market makers?
        
        // Transfer collateral 1:1
        collateralToken.transfer(msg.sender, nTokens);

        // Clear balances
        if (yesTokens[marketId][msg.sender] > 0 ) yesTokens[marketId][msg.sender] = 0;
        if (noTokens[marketId][msg.sender] > 0 ) noTokens[marketId][msg.sender] = 0;

        // don't forget to reduce totalCollateral
        totalCollaterals[marketId] = totalCollaterals[marketId] - nTokens;
        
        emit WinningsRedeemed(marketId, msg.sender, nTokens);

        return nTokens; // nTokens === amountUSDC (1:1 mapping)
    }
    
    /**
    This function retrieves the number of YES and NO position tokens held by a user for a specific market.
    @param marketId The ID of the market.
    @param user The address of the user whose tokens are being queried.
    @return yes The number of YES position tokens held by the user.
    @return no The number of NO position tokens held by the user.
    */
    function getUserTokens(uint128 marketId, address user) external view returns (uint256 yes, uint256 no) {
        return (yesTokens[marketId][user], noTokens[marketId][user]);
    }

    /**
    This function gets the total collateral for a specific market.
    @param marketId The ID of the market.
    @return amountUSDC The total amount of collateral deposited in the specified market.
    */
    function getTotalCollateral(uint128 marketId) external view returns (uint256 amountUSDC) {
        return totalCollaterals[marketId];
    }

    /**
    This function associates the specified token with the contract using the Hedera Token Service precompile.
    It can only be called by the contract owner.
    @param tokenAddress The address of the token to be associated with the contract.
    */
    function associateToken(address tokenAddress) external onlyOwner {
        (bool success, bytes memory result) = HEDERA_PRECOMPILE.call(
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

    function calcSig(
        uint128 txId,
        uint128 marketId,
        uint256 collateralUSDC
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(txId, marketId, collateralUSDC));
    }

    /**
    Validate ECDSA signature using Hedera precompiled contract.
    @param signer The address of the signer.
    @param messageHash The hash of the signed message.
    @param signature The signature to validate.
    @return isValid True if the signature is valid, false otherwise.
    */
    function validateECDSASignature(
        address signer,
        bytes32 messageHash,
        bytes memory signature
    ) internal view returns (bool isValid) {
        (bool success, bytes memory result) = HEDERA_PRECOMPILE.staticcall(
            abi.encodeWithSignature(
                "validateECDSASignature(address,bytes32,bytes)",
                signer,
                messageHash,
                signature
            )
        );
        require(success, "ECDSA validation failed");
        return abi.decode(result, (bool));
    }

    /**
    Validate Ed25519 signature using Hedera precompiled contract.
    @param signer The address of the signer.
    @param messageHash The hash of the signed message.
    @param signature The signature to validate.
    @return isValid True if the signature is valid, false otherwise.
    */
    function validateEd25519Signature(
        address signer,
        bytes32 messageHash,
        bytes memory signature
    ) internal view returns (bool isValid) {
        (bool success, bytes memory result) = HEDERA_PRECOMPILE.staticcall(
            abi.encodeWithSignature(
                "validateEd25519Signature(address,bytes32,bytes)",
                signer,
                messageHash,
                signature
            )
        );
        require(success, "Ed25519 validation failed");
        return abi.decode(result, (bool));
    }
}
