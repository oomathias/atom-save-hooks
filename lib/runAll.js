'use babel'
/* global atom */

import execa from 'execa'
import parse from 'string-argv'
import path from 'path'

import pkgName from './pkgName'

const debug = require('debug')(`${pkgName}:runAll`)

const runAll = (tasks, context) => {
  for (const task of tasks) {
    debug(`Runnin tasks for "${task.title}"`)
    try {
      runTask(task, context)
    } catch (e) {
      // We should't come here
      if (task.showError)
        atom.notifications.addError(`[${task.title}]`, {
          detail: 'Something went wrong.',
          dismissable: true,
        })
    }
  }
}

const runTask = async (task, context) => {
  var total = task.commands.length
  for (var i = 0; i < total; i++) {
    // Stop if failure
    const cursor = { current: i + 1, total }
    if (!(await runCmd(task.title, task.commands[i], cursor, context))) break
  }
}

const runCmd = async (title, command, cursor, context) => {
  const {
    cmd,
    showOutput,
    showError,
    preferLocal,
    appendFile,
    timeout,
  } = command
  const { rootPath, savedPath, signal } = context
  const { current, total } = cursor

  debug(`> "${cmd}"`)

  const [bin, ...args] = parse(injectVariables(cmd, rootPath, savedPath))
  if (appendFile) args.push(savedPath)
  const spawned = `\`[${pkgName}]\` [${title}] (${current}/${total})`

  const execaOptions = {
    cwd: rootPath,
    localDir: rootPath,
    cleanup: true,
    reject: false,
    preferLocal,
    timeout,
  }

  if (signal && signal.add) {
    try {
      signal.add(`[${pkgName}] ${spawned}`)
    } catch (e) {}
  }

  const result = await execa(bin, args, Object.assign({}, execaOptions))

  if (signal && signal.remove) {
    try {
      signal.remove(`[${pkgName}] ${spawned}`)
    } catch (e) {}
  }

  if (result.failed || result.killed || result.signal != null) {
    debug(
      'Failure',
      cmd,
      Object.assign({}, result, { message: result.message })
    )
    if (showError) {
      let detail = result.stderr || result.message
      if (result.timedOut)
        detail =
          `Timed out: it took more than ${(timeout / 1000).toFixed(2)}s\n \n` +
          detail
      detail = `CWD: ${rootPath}\n \n` + detail
      atom.notifications.addError(`${spawned} -STOP-`, { detail })
    }
    return false
  }
  debug('Success', cmd, Object.assign({}, result))
  if (showOutput) {
    let detail = `
CMD: ${bin} ${args.join(' ')}
CWD: ${rootPath}
\n \n
OUTPUT: ${result.stdout}`
    atom.notifications.addSuccess(`${spawned}`, { detail })
  }
  return true
}

const injectVariables = (cmd, root, saved) => {
  debug('Injecting variables')
  const { dir, base: file, ext, name } = path.parse(saved)
  const absolute = root + path.sep + saved
  const absoluteDir = root + path.sep + dir
  debug(`
    file "${file}"
    name "${name}"
    ext "${ext}"
    path "${saved}"
    dir "${dir}"
    root "${root}"
    absolute "${absolute}"
    absoluteDir "${absoluteDir}"
  `)
  return cmd
    .replace(/\{file\}/g, file)
    .replace(/\{name\}/g, name)
    .replace(/\{ext\}/g, ext)
    .replace(/\{path\}/g, saved)
    .replace(/\{dir\}/g, dir)
    .replace(/\{root\}/g, root)
    .replace(/\{absolute\}/g, absolute)
    .replace(/\{absoluteDir\}/g, absoluteDir)
}

export default runAll
