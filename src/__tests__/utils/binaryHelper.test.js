import {
  downloadAndCopyBinaries,
  getGethOnPath,
  getPlatformSpecificUrl,
  getTesseraOnPath,
  pathToBootnode,
  pathToCakeshop,
  pathToQuorumBinary,
  pathToTesseraJar,
} from '../../utils/binaryHelper'
import { executeSync } from '../../utils/execUtils'
import { cwd } from '../../utils/fileUtils'
import { join } from 'path'
import { TEST_CWD } from '../testHelper'
import { downloadIfMissing } from '../../utils/download'
import { any } from 'expect'

jest.mock('../../utils/download')
jest.mock('../../utils/execUtils')
jest.mock('../../utils/fileUtils')
cwd.mockReturnValue(TEST_CWD)
downloadIfMissing.mockReturnValue(Promise.resolve())

describe('Chooses the right paths to the binaries', () => {
  it('Calls geth binary directly if on path', () => {
    expect(pathToQuorumBinary("PATH")).toEqual("geth")
  })
  it('Calls geth binary in bin folder', () => {
    expect(pathToQuorumBinary("2.4.0")).toEqual(join(cwd(), "bin/quorum/2.4.0/geth"))
  })
  it('Calls tessera using $TESSERA_JAR', () => {
    expect(pathToTesseraJar("PATH")).toEqual("$TESSERA_JAR")
  })
  it('Calls tessera using bin folder jar', () => {
    expect(pathToTesseraJar("0.10.2")).toEqual(join(cwd(), "bin/tessera/0.10.2/tessera-app.jar"))
  })
  it('Calls cakeshop using bin folder war', () => {
    expect(pathToCakeshop()).toEqual(join(cwd(), "bin/cakeshop/0.11.0-RC2/cakeshop.war"))
  })
  it('Calls bootnode using bin folder', () => {
    expect(pathToBootnode()).toEqual(join(cwd(), "bin/bootnode/1.8.27/bootnode"))
  })
})

describe('Finds binaries on path', () => {
  it('Returns no choices when local quorum is not found', () => {
    executeSync.mockImplementationOnce(() => {
      throw new Error('Not found')
    })
    expect(getGethOnPath()).toEqual([])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    executeSync.mockReturnValueOnce(Buffer.from(''))
    expect(getGethOnPath()).toEqual([])
    expect(executeSync).toHaveBeenLastCalledWith('which geth')

  })
  it('Returns no choices when local geth (not quorum) is found', () => {
    executeSync.mockReturnValueOnce(Buffer.from('/usr/bin/geth'))
    executeSync.mockReturnValueOnce(Buffer.from(vanillaGethVersion))
    expect(getGethOnPath()).toEqual([])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    expect(executeSync).toHaveBeenLastCalledWith('geth version')
  })
  it('Returns choice when local quorum is found, parses version', () => {
    executeSync.mockReturnValueOnce(Buffer.from('/usr/bin/geth'))
    executeSync.mockReturnValueOnce(Buffer.from(quorumVersion))
    expect(getGethOnPath()).toEqual([{
        name: 'Quorum 2.2.4 on path (/usr/bin/geth)',
        value: 'PATH',
      }])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    expect(executeSync).toHaveBeenLastCalledWith('geth version')
  })
  it('Returns no choices when $TESSERA_JAR not set', () => {
  })
  it('Returns choice when $TESSERA_JAR is set', () => {
    const originalEnv = process.env
    overrideProcessValue('env', {'TESSERA_JAR': '/path/to/jar'})
    expect(getTesseraOnPath()).toEqual([{
      name: 'Tessera at $TESSERA_JAR (/path/to/jar)',
      value: 'PATH',
    }])
    overrideProcessValue('env', originalEnv)
  })
})

describe('Handles different binary file urls', () => {
  let originalPlatform
  beforeAll(() => {
    originalPlatform = process.platform
  })
  afterAll(() => {
    overrideProcessValue('platform', originalPlatform)
  })
  it('Works with cross-platform single urls', () => {
    expect(getPlatformSpecificUrl(crossPlatform)).toEqual('crossplatform_url')
  })
  it('Works with multiple platform urls', () => {
    overrideProcessValue('platform', 'linux')
    expect(getPlatformSpecificUrl(multiplePlatform)).toEqual('linux_url')
    overrideProcessValue('platform', 'darwin')
    expect(getPlatformSpecificUrl(multiplePlatform)).toEqual('mac_url')
  })
  it('Throws an error when using an unsupported platform', () => {
    overrideProcessValue('platform', 'windows_nt')
    expect(() => getPlatformSpecificUrl(multiplePlatform)).toThrow(new Error('Sorry, your platform (windows_nt) is not supported.'))
  })
})

describe('Downloads binaries', () => {
  const baseNetwork = {
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    cakeshop: false,
    consensus: 'raft',
    generateKeys: false,
    deployment: 'bash'
  }
  beforeEach(() => {
    downloadIfMissing.mockClear()
  })
  it('Downloads correct bins for raft tessera', async () => {
    const config = {
      network: {
        ...baseNetwork,
      }
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', '2.4.0')
    expect(downloadIfMissing).toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).not.toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('istanbul', any(String))
  })
  it('Downloads correct bins for istanbul + keygen + cakeshop, just quorum', async () => {
    const config = {
      network: {
        ...baseNetwork,
        transactionManager: 'none',
        consensus: 'istanbul',
        cakeshop: true,
        generateKeys: true
      }
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', '2.4.0')
    expect(downloadIfMissing).not.toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).toBeCalledWith('istanbul', any(String))
  })
  it('Downloads nothing for raft docker, no keygen', async () => {
    const config = {
      network: {
        ...baseNetwork,
        deployment: 'docker-compose'
      }
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).not.toBeCalledWith('quorum', '2.4.0')
    expect(downloadIfMissing).not.toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).not.toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('istanbul', any(String))
  })
  it('Downloads correct bins for docker with keygen', async () => {
    const config = {
      network: {
        ...baseNetwork,
        deployment: 'docker-compose',
        generateKeys: true
      }
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', '2.4.0')
    expect(downloadIfMissing).toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).not.toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('istanbul', any(String))
  })
  it('Does not download geth and tessera when on path', async () => {
    const config = {
      network: {
        ...baseNetwork,
        quorumVersion: 'PATH',
        transactionManager: 'PATH'
      }
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).not.toBeCalledWith('quorum', '2.4.0')
    expect(downloadIfMissing).not.toBeCalledWith('tessera', '0.10.2')
  })
})

function overrideProcessValue (key, value) {
  // process.platform is read-only, use this workaround to set it
  Object.defineProperty(process, key, { value })
}

const crossPlatform = {
  name: 'file.jar',
  url: 'crossplatform_url',
  type: 'jar',
}

const multiplePlatform = {
  name: 'compiled_bin',
  url: {
    darwin: 'mac_url',
    linux: 'linux_url',
  },
  type: 'tar.gz',
  files: [
    'compiled_bin',
  ],
}
const vanillaGethVersion = `Geth
Version: 1.9.0-unstable
Git Commit: f03402232cd7bcc558b70a20df5b326b1d71e1ad
Architecture: amd64
Protocol Versions: [63 62]
Network Id: 1
Go Version: go1.12
Operating System: darwin
GOPATH=/Users/bradmcdermott/go
GOROOT=/usr/local/Cellar/go/1.12/libexec`

const quorumVersion = `Geth
Version: 1.8.18-stable
Git Commit: d0262e2139ce74d16b127dd3b4ded57fd29e3a73
Quorum Version: 2.2.4
Architecture: amd64
Protocol Versions: [63 62]
Network Id: 1337
Go Version: go1.9.7
Operating System: darwin
GOPATH=/Users/bradmcdermott/go
GOROOT=/usr/local/Cellar/go@1.9/1.9.7/libexec`

