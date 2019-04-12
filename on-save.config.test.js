module.exports = {
  '*.js': [
    {
      cmd: ['import-sort --write', 'prettier --write'],
      showOutput: true,
    },
    {
      // Fail
      cmd: 'prettier',
      preferLocal: false,
      showError: true,
    },
  ],
  '*': [
    {
      // Variables
      cmd: 'echo {name} {file} {ext} {path} {dir} {root} {absolute} {absoluteDir}',
      appendFile: false,
      showOutput: true,
    },
    {
      // NoAppendFile
      cmd: 'echo nofile',
      appendFile: false,
      showOutput: true,
    },
    {
      // AppendFile
      cmd: 'echo withfile',
      appendFile: true,
      showOutput: true,
    },
    {
      // Error
      cmd: 'sleep 1s',
      timeout: 1,
      appendFile: false,
      showError: true,
    },
    {
      // NoError
      cmd: 'sleep 1s',
      timeout: 1,
      showError: false,
    },
  ],
}
