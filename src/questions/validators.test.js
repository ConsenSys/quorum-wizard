import {
  transformCakeshopAnswer,
  validateNetworkId,
  validateNumberStringInRange,
} from './validators'
import { isJava11Plus } from '../utils/execUtils'
import { LATEST_CAKESHOP, LATEST_CAKESHOP_J8 } from '../generators/download'
import { getLatestCakeshop } from '../generators/versionHelper'

jest.mock('../utils/execUtils')
jest.mock('../generators/versionHelper')

getLatestCakeshop.mockReturnValue(LATEST_CAKESHOP)

test('accepts answer bottom of range', () => {
  expect(validateNumberStringInRange('2', 2, 3)).toBe(true)
})

test('accepts answer top of range', () => {
  expect(validateNumberStringInRange('3', 2, 3)).toBe(true)
})

test('rejects answer outside of range', () => {
  expect(validateNumberStringInRange('1', 2, 3))
    .toEqual('Number must be between 2 and 3 (inclusive)')
})

test('rejects answer that is not a number string', () => {
  expect(validateNumberStringInRange('on', 2, 3))
    .toEqual('Number must be between 2 and 3 (inclusive)')
})

test('allows network id that is not 1', () => {
  expect(validateNetworkId('0')).toEqual(true)
  expect(validateNetworkId('2')).toEqual(true)
  expect(validateNetworkId('10')).toEqual(true)
  expect(validateNetworkId('19283847')).toEqual(true)
})

test('rejects network id of 1', () => {
  expect(validateNetworkId('1'))
    .toEqual('Ethereum Mainnet has a network id of 1. Please choose another id')
})

test('rejects network id of less than 0', () => {
  expect(validateNetworkId('-1')).toEqual('Network ID must be positive')
})

test('rejects network id that is not a number', () => {
  expect(validateNetworkId('n')).toEqual('Network ID must be a number')
})

test('Turns cakeshop answer from boolean to version/none', () => {
  expect(transformCakeshopAnswer('No')).toEqual('none')
  isJava11Plus.mockReturnValueOnce(false)
  expect(transformCakeshopAnswer('Yes')).toEqual(LATEST_CAKESHOP_J8)
  isJava11Plus.mockReturnValueOnce(true)
  expect(transformCakeshopAnswer('Yes')).toEqual(LATEST_CAKESHOP)
})
