import {
  getGethOnPath,
  getDownloadableGethChoices,
  getAllGethChoices,
  getLatestCakeshop,
  disableTesseraIfWrongJavaVersion,
  getTesseraOnPath,
  getDownloadableTesseraChoices,
} from './versionHelper'
import {
  executeSync,
  isJava11Plus,
} from '../utils/execUtils'
import {
  getVersionsBintray,
  getLatestVersionGithub,
  LATEST_QUORUM,
  LATEST_CAKESHOP,
  LATEST_TESSERA,
  LATEST_TESSERA_J8,
} from './download'

jest.mock('../utils/execUtils')
jest.mock('./download')

getVersionsBintray.mockReturnValue([LATEST_QUORUM, '2.5.0'])
getLatestVersionGithub.mockReturnValue(`v${LATEST_CAKESHOP}`)

describe('presents correct binary options', () => {
  it('presents available geth options for bash', async () => {
    const choices = await getDownloadableGethChoices('bash')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
  })
  it('presents available geth options for docker', async () => {
    const choices = await getDownloadableGethChoices('docker')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
  })
  it('presents available geth options for bash', async () => {
    const choices = await getAllGethChoices('bash')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Quorum ${'2.5.0'}` && choice.disabled === false)).toBeTruthy()
  })
  it('presents available geth options for docker', async () => {
    const choices = await getAllGethChoices('docker')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
  })
  it('presents latest cakeshop option', async () => {
    const latest = await getLatestCakeshop()
    expect(latest.name === `Cakeshop ${LATEST_CAKESHOP}` && latest.disabled === false).toBeTruthy()
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
    expect(getGethOnPath()).toEqual([
      {
        name: 'Quorum 2.2.4 on path (/usr/bin/geth)',
        value: 'PATH',
      },
    ])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    expect(executeSync).toHaveBeenLastCalledWith('geth version')
  })
})

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

test('Disables java choices based on java version', () => {
  isJava11Plus.mockReturnValue(true)
  expect(disableTesseraIfWrongJavaVersion('10.3.0')).toEqual(false)
  expect(disableTesseraIfWrongJavaVersion('10.2.0')).toEqual('Disabled, requires Java 8')
  expect(disableTesseraIfWrongJavaVersion('10.1.0')).toEqual('Disabled, requires Java 8')
  isJava11Plus.mockReturnValue(false)
  expect(disableTesseraIfWrongJavaVersion('10.3.0')).toEqual('Disabled, requires Java 11+')
  expect(disableTesseraIfWrongJavaVersion('10.2.0')).toEqual(false)
})

describe('Finds binaries on path', () => {
  it('Returns no choices when $TESSERA_JAR not set', () => {
    const originalEnv = process.env
    overrideProcessValue('env', { TESSERA_JAR: '' })
    expect(getTesseraOnPath()).toEqual([])
    overrideProcessValue('env', originalEnv)
  })
  it('Returns choice when $TESSERA_JAR is set', () => {
    const originalEnv = process.env
    overrideProcessValue('env', { TESSERA_JAR: '/path/to/jar' })
    expect(getTesseraOnPath()).toEqual([
      {
        name: 'Tessera at $TESSERA_JAR (/path/to/jar)',
        value: 'PATH',
      },
    ])
    overrideProcessValue('env', originalEnv)
  })
})

describe('presents the correct binary options', () => {
  it('disables java 11 jars if in bash mode and on jdk 8', () => {
    isJava11Plus.mockReturnValue(false)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('disables 0.10.2 if in bash mode and on jdk 11+', () => {
    isJava11Plus.mockReturnValue(true)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('does not disable tessera options in docker mode', () => {
    const choices = getDownloadableTesseraChoices('docker-compose')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('forces and doesnt disable tessera options in kubernetes mode', () => {
    const choices = getDownloadableTesseraChoices('kubernetes')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).not.toBeTruthy()
  })
})

function overrideProcessValue(key, value) {
  // process.platform is read-only, use this workaround to set it
  Object.defineProperty(process, key, { value })
}
