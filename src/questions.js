const { validateNumberStringInRange } = require('./utils/questionUtils')

module.exports = {
  INITIAL_MODE: {
    type: 'list',
    name: 'mode',
    message: 'What would you like to do?',
    choices: [
      { name: 'Quickstart (quorum-examples)', value: 1 },
      { name: 'Create Custom Network', value: 2 },
      { name: 'Exit', value: 3 }
    ]
  },
  NUMBER_NODES: {
    type: 'input', // bug with number type when invalid, can't delete old value
    name: 'numberNodes',
    message: 'How many nodes? (2-7)',
    default: '7',
    validate: (input) => validateNumberStringInRange(input, 2, 7)
  },
  CONSENSUS_MODE: {
    type: 'list',
    name: 'consensus',
    message: 'Which consensus mode?',
    choices: [
      'istanbul',
      'raft',
    ]
  },
  DEPLOYMENT_TYPE: {
    type: 'list',
    name: 'deployment',
    message: 'How are you going to deploy?',
    choices: [
      'bash',
      // 'docker-compose',
      // 'kubernetes',
      // 'vagrant',
    ]
  }
}
