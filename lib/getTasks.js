'use babel'

import mm from 'micromatch'

import pkgName from './pkgName'

const debug = require('debug')(`${pkgName}:getTasks`)
const getTasks = (savedPath, config) => {
  debug('Getting tasks')
  // Returns an array of tasks matching the file saved
  return Object.keys(config)
    .filter(glob => mm.isMatch(savedPath, glob, { dot: true }))
    .map(glob => ({ commands: config[glob], title: glob }))
}

export default getTasks
