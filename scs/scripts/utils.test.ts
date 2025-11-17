import { uuid7_to_uint128, uint128_to_uuid7 } from './utils'

describe('uuid7_to_uint128', () => {
  test('converts valid UUIDv7 to BigInt', () => {
    const uuid = '0187f67a-bcd1-7a2b-9e4f-123456789abc'
    const result = uuid7_to_uint128(uuid)
    expect(result.uint128).toBe(BigInt('0x0187f67abcd17a2b9e4f123456789abc'))
  })

  test('throws error for invalid UUIDv7 format', () => {
    const invalidUuid = 'invalid-uuid'
    expect(() => uuid7_to_uint128(invalidUuid)).toThrow('Invalid UUIDv7 format')
  })
})

describe('uint128_to_uuid7', () => {
  test('converts BigInt to valid UUIDv7', () => {
    const uint128 = BigInt('0x0187f67abcd17a2b9e4f123456789abc')
    const result = uint128_to_uuid7(uint128)
    expect(result).toBe('0187f67a-bcd1-7a2b-9e4f-123456789abc')
  })
})

describe('uint128_to_uuid7', () => {
  test('converts BigInt to valid UUIDv7', () => {
    const uint128 = BigInt(400842983282)
    const result = uint128_to_uuid7(uint128)
    expect(result).toBe('00000000-0000-7000-0000-005d541a8772')
  })
})

describe('uint128_to_uuid7', () => {
  test('converts BigInt to valid UUIDv7', () => {
    const uint128 = BigInt('0xa37482748d7429844fa882298748e93f')
    const result = uint128_to_uuid7(uint128)
    expect(result).toBe('a3748274-8d74-7984-4fa8-82298748e93f')
  })
})

describe('uint128_to_uuid7', () => {
  test('converts BigInt to valid UUIDv7', () => {
    const uint128 = BigInt(888881111112222223333333289284400842983282)
    const result = uint128_to_uuid7(uint128)
    expect(result).toBe('a342fd2e-39d8-7000-0000-000000000000000')
  })
})


describe('Round-Trip Conversion', () => {
  test('converts UUIDv7 to BigInt and back to UUIDv7', () => {
    const uuid = '0187f67a-bcd1-7a2b-9e4f-123456789abc'
    const { uint128 } = uuid7_to_uint128(uuid)
    const result = uint128_to_uuid7(uint128)
    expect(result).toBe(uuid)
  })
})