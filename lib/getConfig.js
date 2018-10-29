'use babel'
/* global atom, snapshotResult */

import cosmiconfig from 'cosmiconfig'
import { dirname } from 'path'

import pkgName, { atomPkgName } from './pkgName'
import { isValidConfig, normalizeConfig } from './parseConfig'

const debug = require('debug')(`${pkgName}:getConfig`)
let cache = new Map()
let explorer

const createExplorer = (useCache) => {
  explorer = cosmiconfig(atomPkgName, {
    searchPlaces: [
      'package.json',
      `.${atomPkgName.replace(/-/g, '')}rc`,
      `${atomPkgName}.config.js`
    ],
    packageProp: atomPkgName,
    cache: useCache
  })
}

const getConfig = (savedPath, useCache) => {
  if (!explorer) createExplorer(useCache)
  debug('Getting config', savedPath)
  let { config, filepath: configPath } = loadConfig(savedPath) || {}
  if (useCache && cache.has(configPath)) {
    debug('Resolving config for `%s` from cache', configPath)
    return cache.get(configPath)
  }
  if (!useCache && /.config.js$/.test(configPath)) {
    debug('Invilating cache for `%s` from cosmiconfig', configPath)
    // HACK: Force cache reload for *.config.js
    // see https://github.com/davidtheclark/cosmiconfig/issues/156
    delete require.cache[configPath]
    // Atom custom require cache
    Object.keys(snapshotResult.customRequire.cache).forEach((cacheKey) => {
      if (cacheKey.indexOf(`${pkgName}.config.js`) > 0) {
        delete snapshotResult.customRequire.cache[cacheKey]
      }
    })
  }
  if (!config || !configPath || !isValidConfig(config)) return {}
  const result = {
    config: normalizeConfig(config),
    configDir: dirname(configPath)
  }
  if (useCache) cache.set(configPath, result)
  return result
}

const loadConfig = (savedPath) => {
  debug('Loading config', savedPath)
  if (!savedPath) return
  try {
    return explorer.searchSync(dirname(savedPath))
  } catch (err) {
    atom.notifications.addError('Could not parse configuration file', { detail: err.message })
  }
}

export const clearCache = () => {
  debug('Clearing config cache')
  cache = new Map()
  explorer = undefined
}

export default getConfig
