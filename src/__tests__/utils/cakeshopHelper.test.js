import { join } from 'path'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import {
  copyFile,
  createFolder,
  cwd,
  writeJsonFile,
} from '../../utils/fileUtils'
import { buildCakeshopDir } from '../../utils/cakeshopHelper'
import { anything } from 'expect'
import { TEST_CWD } from '../testHelper'

jest.mock('../../utils/fileUtils')
cwd.mockReturnValue(TEST_CWD)

describe('creates a cakeshop directory structure for bash', () => {
  it('creates directory structure for cakeshop files and moves them in', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash' , true)

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'), 'cakeshop.json', anything())
    expect(copyFile).toBeCalledWith(createPath('lib', 'cakeshop_application.properties.template'), createNetPath(config, 'qdata/cakeshop/local','application.properties'))
  })
})

function createPath(...relativePaths) {
  return join(cwd(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return join(cwd(), 'network', config.network.name, ...relativePaths)
}