'use babel'
/* global atom */

// TODO: Make sure tasks, task, commands, command naming is correct

import _isGlob from 'is-glob'

import pkgName from './pkgName'

const debug = require('debug')(`${pkgName}:parseConfig`)

let defaultOptions = {}
let allowedOptions = [];;;;

const loadDefaultOptions = () => {
  defaultOptions = {
    showError: atom.config.get(`${pkgName}.showError`),
    showOutput: atom.config.get(`${pkgName}.showOutput`),
    timeout: atom.config.get(`${pkgName}.timeout`),
    preferLocal: atom.config.get(`${pkgName}.preferLocal`),
    appendFile: atom.config.get(`${pkgName}.appendFile`),
  }
  allowedOptions = ['cmd', ...Object.keys(defaultOptions)]
}

const validOptions = {
  showError: false,
  showOutput: false,
  timeout: 60000,
  preferLocal: true,
  appendFile: true,
}

const validConfig = {
  'lib1/*.js': 'echo 1',
  'lib2/*.js': ['echo 1', 'echo 2'],
  'lib3/*.js': {
    cmd: 'echo 1',
    ...validOptions,
  },
  'lib4/*.js': {
    cmd: ['echo 1', 'echo 2'],
    ...validOptions,
  },
  'lib5/*.js': [
    {
      cmd: 'echo 1',
      ...validOptions,
    },
    {
      cmd: 'echo 2',
      ...validOptions,
    },
  ],
}

const isDefined = value => value !== undefined

const isBoolean = value => value === false || value === true

const isNumber = value => Number.isFinite(value)

const isString = value => typeof value === 'string'

const isArray = value => Array.isArray(value)

const isObject = value => typeof value === 'object' && !Array.isArray(value)

const isGlob = value => _isGlob(value)

const isEmpty = value =>
  value === null ||
  !isDefined(value) ||
  (isString(value) && value === '') ||
  (isArray(value) && value.length === 0) ||
  (isObject(value) && Object.keys(value).length === 0)

const castArray = value => (isArray(value) ? value : [value])

const isSimple = task => {
  debug('isSimple', task)
  return isString(task) || (isArray(task) && isArrayOfString(task))
}

const isClassic = (task, allowedOptions) => {
  debug('isClassic', task, allowedOptions)
  return isObject(task) && isValidObject(task, allowedOptions) && isSimple(task.cmd)
}

const isExtended = (task, allowedOptions) => {
  debug('isExtended', task, allowedOptions)
  return Array(task) && isArrayOfObject(task) && task.every(t => isClassic(t, allowedOptions))
}

const simpleToExpended = (commands, options) => {
  debug('simpleToExpended', commands, options)
  return castArray(commands).reduce(
    (acc, cmd) => (isEmpty(cmd) ? acc : acc.concat([{ cmd, ...options }])),
    []
  )
}

const classicToExpended = (commands, options) => {
  debug('classicToExpended', commands, options)
  const { cmd, ...opts } = commands
  return simpleToExpended(cmd, { ...options, ...opts })
}

const normalizeExpended = (commands, options) => {
  debug('normalizeExpended', commands, options)
  let normalized = []
  for (let cmd of commands) {
    normalized = [...normalized, ...classicToExpended(cmd, options)]
  }
  return normalized
}

const includes = (options, value) => {
  debug('includes', options, value)
  if (!isArray(options) || !isString(value)) throw new Error('invalid signature')
  return options.includes(value)
}

const isArrayOfString = value => {
  debug('isArrayOfString', value)
  if (!isArray(value)) throw new Error('invalid signature')
  return value.every(e => isString(e))
}

const isArrayOfObject = value => {
  debug('isArrayOfObject', value)
  if (!isArray(value)) throw new Error('invalid signature')
  return value.every(e => isObject(e))
}

const isValidObject = (value, allowedOptions) => {
  debug('isValidObject', value, allowedOptions)
  if (!isArray(allowedOptions) || !isObject(value)) throw new Error('invalid signature')
  return Object.keys(value).every(key => includes(allowedOptions, key))
}

const normalizeConfig = (config, options = defaultOptions) => {
  debug('Normalizing config', config)
  let normalized = {}
  let errorMessage = 'Invalid configuration passed to normalizeConfig'
  try {
    for (let glob in config) {
      let task = config[glob]
      if (isSimple(task)) {
        normalized[glob] = simpleToExpended(task, options)
      } else if (isClassic(task, allowedOptions)) {
        normalized[glob] = classicToExpended(task, options)
      } else if (isExtended(task, allowedOptions)) {
        normalized[glob] = normalizeExpended(task, options)
      } else {
        throw new Error(errorMessage)
      }
    }
  } catch (e) {
    throw new Error(errorMessage)
  }
  return normalized
}

const isValidConfig = config => {
  debug('Validating config', config)
  const errors = []
  const isValidSimple = (glob, cmd) => {
    if (isArray(cmd)) {
      cmd.forEach(c => {
        if (!isString(c)) {
          errors.push(
            `${JSON.stringify(glob)}: Each cmd should be a string. ${JSON.stringify(c)} isn't`
          )
        }
      })
    } else if (!isString(cmd)) {
      errors.push(
        `${JSON.stringify(glob)}: cmd should be a string or array. ${JSON.stringify(cmd)} isn't`
      )
    }
  }
  const isValidClassic = (glob, task) => {
    if (!isValidObject(task, allowedOptions)) {
      errors.push(`${JSON.stringify(glob)}: contains invalid options`)
    }
    if (!isDefined(task.cmd)) {
      errors.push(
        `${JSON.stringify(glob)}: 'cmd' is required if you use a classic or extended format`
      )
    } else {
      isValidSimple(glob, task.cmd)
    }
    if (isDefined(task.showOutput) && !isBoolean(task.showOutput))
      errors.push(`${JSON.stringify(glob)}: showOutput should be a boolean`)
    if (isDefined(task.showError) && !isBoolean(task.showError))
      errors.push(`${JSON.stringify(glob)}: showError should be a boolean`)
    if (isDefined(task.preferLocal) && !isBoolean(task.preferLocal))
      errors.push(`${JSON.stringify(glob)}: preferLocal should be a boolean`)
    if (isDefined(task.appendFile) && !isBoolean(task.appendFile))
      errors.push(`${JSON.stringify(glob)}: appendFile should be a boolean`)
    if (isDefined(task.timeout) && !isNumber(task.timeout))
      errors.push(`${JSON.stringify(glob)}: timeout should be a number in milliseconds`)
  }
  if (!isObject(config)) errors.push(`config should be an object`)
  for (let glob in config) {
    if (!isGlob(glob)) errors.push(`${JSON.stringify(glob)}: isn't a glob ('src/*.js')`)
    let task = config[glob]
    if (isString(task)) {
      continue
    } else if (isObject(task)) {
      isValidClassic(glob, task)
    } else if (isArray(task)) {
      const looksLikeExtended = isArrayOfObject(task)
      const looksLikeSimple = isArrayOfString(task)
      if (!looksLikeSimple && !looksLikeExtended) {
        errors.push(`${JSON.stringify(glob)}: You cannot mix simple and extended formats`)
        continue
      }
      if (looksLikeExtended) {
        for (let cmd of task) {
          isValidClassic(glob, cmd)
        }
      }
    } else {
      errors.push(`${JSON.stringify(glob)}: invalid task`)
    }
  }
  if (!isEmpty(errors)) {
    errors.push(` \nYou can get more information on https://atom.io/packages/save-hooks`)
    atom.notifications.addError('Invalid configuration file', { detail: errors.join(`\n`) })
    return false
  }
  return true
}

export {
  isValidConfig,
  normalizeConfig,
  allowedOptions,
  defaultOptions,
  validConfig,
  loadDefaultOptions,
}
