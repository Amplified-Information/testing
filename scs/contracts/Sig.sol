// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHederaAccountService {
    function isAuthorizedRaw(address account, bytes calldata messageHash, bytes calldata signatureBlob) external view returns (bool);
}

contract Sig {

  address constant HAS = address(0x16a);

  function verify(bytes32 r, bytes32 s, uint8 v, bytes32 msgHash) public pure returns (address) {
    // Recover the signer's address using ecrecover
    address signer = ecrecover(msgHash /* ethSignedMessageHash */, v, r, s);
    return signer;
  }

  function verifyHAS(address account, bytes memory messageHash, bytes memory signature) external returns (bool, int64) {
      (bool success, bytes memory result) = HAS.call(
          abi.encodeWithSelector(
              bytes4(keccak256("isAuthorized(address,bytes,bytes)")),
              account,
              messageHash,
              signature
          )
      );
      // require(success, "HTS call failed");
      int64 responseCode = abi.decode(result, (int64));
      // require(responseCode == 22, "Association not successful ");
      return (success, responseCode);
    }
}




// pragma solidity ^0.8.20;

// interface IHederaAccountService {
//   /** 
//   Determines if the signature is valid for the given message hash and account.
//   It is assumed that the signature is composed of a single EDCSA or ED25519 key.
//   @param account The account to check the signature against.
//   @param messageHash The hash of the message to check the signature against.
//   @param signature The signature to check.
//   @return responseCode The response code for the status of the request.  SUCCESS is 22.
//   @return authorized True if the signature is valid, false otherwise.
//   */
//   function isAuthorizedRaw(address account, bytes memory messageHash, bytes memory signature) external returns (int64 responseCode, bool authorized);
// }

// contract Sig {
//   function verify(bytes32 r, bytes32 s, uint8 v, bytes32 msgHash) public pure returns (address) {
//     // Recover the signer's address using ecrecover
//     address signer = ecrecover(msgHash /* ethSignedMessageHash */, v, r, s);
//     return signer;
//   }

//   // function verifyAddPrefix(bytes32 r, bytes32 s, uint8 v, bytes32 msgHash) public pure returns (address) {
//   //   // Prefix the message hash with the Hedera Signed Message prefix
//   //   bytes32 msgHashPrefixed = keccak256(
//   //       abi.encodePacked("\x19Hedera Signed Message:\n32", msgHash)
//   //   );

//   //   // Recover the signer's address using ecrecover
//   //   address signer = ecrecover(msgHashPrefixed, v, r, s);
//   //   return signer;
//   // }

//   address constant HAS = address(0x16a);

//   event AccountAuthorizationResponse(int64 responseCode, bool response);

//   int32 internal constant SUCCESS = 22;
//   int32 internal constant UNKNOWN = 21;

//   /** 
//   @param account: A 20-byte identifier used to represent an account on the Hedera network or an EVM-compatible account.
//   @param messageHash: A cryptographic hash of the message, calculated using an algorithm like SHA-256 or Keccak-256. This is typically what is signed instead of the raw message.
//   @param signature: A concatenation of the digital signature components, typically including r, s, and v values for ECDSA, or the equivalent data for ED25519 signatures.
//   https://docs.hedera.com/hedera/core-concepts/smart-contracts/understanding-hederas-evm-differences-and-compatibility/for-evm-developers-migrating-to-hedera/accounts-signature-verification-and-keys-ecdsa-vs.-ed25519
//   https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/system-contracts/hedera-account-service/HederaAccountService.sol#L89
//   */
//   function isAuthorizedRaw(address account, bytes memory messageHash, bytes memory signature) public returns (int64 responseCode, bool authorized) {
//     (bool success, bytes memory result) = HAS.call(
//         abi.encodeWithSelector(IHederaAccountService.isAuthorizedRaw.selector, // 0xb2a31da4
//           account, messageHash, signature));
//     (responseCode, authorized) = success ? (SUCCESS, abi.decode(result, (bool))) : (UNKNOWN, false);
//     if (responseCode != SUCCESS) {
//       revert();
//     }
//     emit AccountAuthorizationResponse(responseCode, authorized);
//   }
//   // function isAuthorizedRaw(address account, bytes memory messageHash, bytes memory signature) internal returns (int64 responseCode, bool authorized) {
//   //       (bool success, bytes memory result) = HAS.call(
//   //           abi.encodeWithSelector(IHederaAccountService.isAuthorizedRaw.selector,
//   //               account, messageHash, signature));
//   //       (responseCode, authorized) = success ? (/* HederaResponseCodes.SUCCESS */ uint64(22), abi.decode(result, (bool))) : (/* HederaResponseCodes.UNKNOWN */ uint64(21), false);
//   //   }
//   // function verifyHedera(
//   //   address aliasOrAddress,
//   //   bytes memory messageHash,
//   //   bytes memory signatureBlob
//   //   ) external returns (int64 responseCode,
//   //           bool authorized)  {
//   //       return IHederaAccountService(HAS).isAuthorizedRaw(
//   //           aliasOrAddress,
//   //           messageHash,
//   //           signatureBlob
//   //       );
//   //   }
//   // function verifyHedera(address accountAlias, bytes32 messageHash, bytes memory signatureBlob) public returns (bool success, bytes memory result) {
//   //   (bool _success, bytes memory _result) = HAS.call(
//   //     abi.encodeWithSignature(
//   //       "isAuthorizedRaw(address,bytes32,bytes)",
//   //       accountAlias,
//   //       messageHash,
//   //       signatureBlob
//   //     )
//   //   );
//   //   return (_success, _result);
//   // }

//   // /**
//   // @param accountAlias: A 20-byte identifier used to represent an account on the Hedera network or an EVM-compatible account.
//   // @param messageHash: A cryptographic hash of the message, calculated using an algorithm like SHA-256 or Keccak-256. This is typically what is signed instead of the raw message.
//   // @param signatureBlob: A concatenation of the digital signature components, typically including r, s, and v values for ECDSA, or the equivalent data for ED25519 signatures.
//   // */
//   // function isAuthorizedRaw(
//   //   address accountAlias,
//   //   bytes32 messageHash,
//   //   bytes memory signatureBlob
//   // ) public returns (bool) {
//   //   return IHederaAccountService(HAS).isAuthorizedRaw(
//   //       accountAlias,
//   //       messageHash,
//   //       signatureBlob
//   //   );
//   // }


//   // /// Determines if the signature is valid for the given message hash and account.
//   // /// It is assumed that the signature is composed of a single EDCSA or ED25519 key.
//   // /// @param account The account to check the signature against.
//   // /// @param messageHash The hash of the message to check the signature against.
//   // /// @param signature The signature to check.
//   // /// @return response True if the signature is valid, false otherwise.
//   // function isAuthorizedRaw(address account, bytes memory messageHash, bytes memory signature) internal
//   // returns (bool response) {
//   //     (, bytes memory result) = HAS.call(
//   //         abi.encodeWithSelector(IHederaAccountService.isAuthorizedRaw.selector,
//   //             account, messageHash, signature));
//   //     // _not_ checking `success` allows this call to revert on error
//   //     response = abi.decode(result, (bool));
//   // }
// }
