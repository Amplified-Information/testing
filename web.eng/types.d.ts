// import { Decimal } from 'decimal.js'

type Position = {
  market_id: string
  yes: number
  no: number
}

// see corresponding api code: api/server/lib/sign.go
// unfortunately, cannot have uint128 and uint256 types in TypeScript
// using decimal.js for arbitrary precision arithmetic (including decimals, not just integers)  
type ObjForSigning = {
  // N.B. Math.abs(priceUsd)
  collateralUsd_abs_scaled: string,
  marketId_uuid: string,
  txId_uuid: string,
}

export type {
  Position,
  ObjForSigning
}
