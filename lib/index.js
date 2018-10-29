'use babel'
/* global atom */

import debounce from 'lodash.debounce'
import { CompositeDisposable } from 'atom'
import { relative } from 'path'

import getTasks from './getTasks'
import pkgName from './pkgName'
import runAll from './runAll'
import getConfig, { clearCache } from './getConfig'
import { loadDefaultOptions } from './parseConfig'

const createDebug = require('debug')
// createDebug.enable(`${pkgName}*`)
// createDebug.disable(`${pkgName}*`)
const debug = createDebug(pkgName)

export default {
  subscriptions: null,
  signal: null,
  useCache: true,
  cache: new Map(),
  config: {
    showError: {
      title: 'Show errors',
      description: 'Capture stderr and displays a notification for each command executed',
      type: 'boolean',
      default: false
    },
    showOutput: {
      title: 'Show outputs',
      description: 'Capture stdout and displays a notification for each command executed',
      type: 'boolean',
      default: false
    },
    timeout: {
      title: 'Timeout',
      description: 'Timeout (in milliseconds) after which the command is killed.',
      type: 'number',
      default: 60000
    },
    preferLocal: {
      title: 'Prefer local bin',
      description: `Prefer locally installed binaries when looking for a binary to execute.
        If you '$ npm install foo', you can then 'foo'.`,
      type: 'boolean',
      default: true
    },
    appendFile: {
      title: 'Append file saved to each commands',
      description: `If you use 'standard --fix', and save the file '/dir/savedfile.js', it will execute 'standard --fix /dir/savedfile.js'.`,
      type: 'boolean',
      default: true
    },
    useCache: {
      title: 'Use cache',
      description: `EXPERIMENTAL: Cache the configuration file. If you modify your project configuration you need to reload Atom (or disable this option)`,
      type: 'boolean',
      default: false
    }
  },

  activate (state) {
    debug('Activating package')
    this.subscriptions = new CompositeDisposable()

    debug('Checking packages dependencies')
    require('atom-package-deps').install(pkgName)

    debug('Loading settings')
    loadDefaultOptions()
    this.useCache = atom.config.get(`${pkgName}.useCache`)

    this.subscriptions.add(atom.config.observe(pkgName, () => {
      debug('Reloading settings')
      this.useCache = atom.config.get(`${pkgName}.useCache`)
      loadDefaultOptions()
      clearCache()
    }))

    debug('Subscribing to onDidSave events')
    this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
      this.subscriptions.add(editor.onDidSave(debounce((event) => {
        this.handleDidSave(event)
      }, 1000, { leading: true })))
    }))
  },

  deactivate () {
    debug('Desactivating package')
    this.subscriptions.dispose()
  },

  consumeSignal (registry) {
    this.signal = registry.create()
    this.subscriptions.add(this.signal)
  },

  handleDidSave ({ path: savedPathAbsolute }) {
    debug('Handling onSave event')
    const { config, configDir } = getConfig(savedPathAbsolute, this.useCache)
    if (!config) {
      debug('Config missing!')
      return
    }
    debug('Config loaded!', config)
    const savedPath = relative(configDir, savedPathAbsolute)
    const tasks = getTasks(savedPath, config)
    debug('Tasks loaded!', tasks)
    const context = { rootPath: configDir, savedPath, signal: this.signal }
    debug('Context loaded!', context)
    runAll(tasks, context)
    if (this.signal && this.signal.clear) this.signal.clear()
  }

}
