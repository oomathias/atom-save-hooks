# save-hooks

> Atom save hooks made easy

This project is heavily inspired by [lint-staged](https://github.com/okonet/lint-staged)

## What can I do?

You can run commands each time you save a file

#### Why?

I was tired of installing lots of Atom packages to do simple things as linting, testing, transpiling or synchronizing files each time I saved a file. Some Atom plugins run for every project and that was a no-go for me. `save-hooks` tasks are defined for each project and can be shared with your collaborators.

#### Like what?

##### Lint your code and fix it

I still recommend to use [linter](https://atom.io/packages/linter) for linting, but `save-hooks` can be used on top of it to auto fix errors.
Useful to fix your code on the fly without having to install 100 atom plugins.

##### Upload / Sync files with remote servers

##### Converts files on the fly

##### Anything available from your terminal, please share what you come up with :heart:

## Install

```sh
apm install save-hooks
```

## Usage

`save-hooks` will recognize:

- a `on-save` property in `package.json`
- a `.onsaverc` file in JSON or YAML format
- a `on-save.config.js` file exporting a JS object

All defined tasks will run regardless of the exit code

Globs aka `**/*.js` must respect [micromatch](https://github.com/micromatch/micromatch) format.

##### package.json

```json
{
  "on-save": {
    "**/*.js": ["import-sort --write"],
    "**/*.{{c,le,sc}ss,g?(raph)ql,htm?(l),js?(on|on5|onl|x|s),md?(x|wn),m?(ark)down,mkdn,ts?(x),vue,y?(a)ml}": [
      "prettier --write"
    ]
  }
}
```

##### on-save.config.js

```js
module.exports = {
  '**/*.{{c,le,sc}ss,g?(raph)ql,htm?(l),js?(on|on5|onl|x|s),md?(x|wn),m?(ark)down,mkdn,ts?(x),vue,y?(a)ml}': [
    'prettier --write',
  ],
}
```

#### Advanced format

```json
{
  "on-save": {
    "lib1/*.js": "echo {name} {file} {ext} {path} {dir} {root} {absolute} {absoluteDir}",
    "lib2/*.js": ["sleep 1", "sleep 2"],
    "lib3/*.js": {
      "cmd": "sleep 1",
      "showError": false,
      "showOutput": false,
      "timeout": 60000,
      "preferLocal": true,
      "appendFile": true
    },
    "lib4/*.js": {
      "cmd": ["sleep 1", "sleep 2"],
      "showError": false
    },
    "lib5/*.js": [
      {
        "cmd": "sleep 1",
        "showError": false
      },
      {
        "cmd": "sleep 2",
        "showError": false
      }
    ]
  }
}
```

## Config

Global config is available in atom settings, you can override the config for each task defined.

| Option        | Default | Description                                                                                                                                                    |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showError`   | `true`  | Capture stderr and displays a notification for each command executed                                                                                           |
| `showOutput`  | `false` | Capture stdout and displays a notification for each command executed                                                                                           |
| `timeout`     | `60000` | Timeout (in milliseconds) after which the command is killed                                                                                                    |
| `preferLocal` | `true`  | Prefer locally installed binaries when looking for a binary to execute. <br> If you `npm install prettier`, you can then call `prettier` directly              |
| `appendFile`  | `true`  | Append file saved to each command. <br> If you use `prettier --write` and save the file `/dir/savedfile.js`, it will call `prettier --write /dir/savedfile.js` |

## Variables

Considering:

- File Saved: `lib/file.js`
- Config Found: `/Users/username/project/on-save.config.js`

| Variable      | Value                                 | Description                |
| ------------- | ------------------------------------- | -------------------------- |
| {file}        | `file.js`                             | File                       |
| {name}        | `file`                                | Name                       |
| {ext}         | `.js`                                 | Extension                  |
| {path}        | `lib/file.js`                         | Project file path          |
| {dir}         | `lib`                                 | Project dir path           |
| {root}        | `/Users/username/project`             | Absolute project root path |
| {absolute}    | `/Users/username/project/lib/file.js` | Absolute file path         |
| {absoluteDir} | `/Users/username/project/lib`         | Absolute dir path          |

## Uninstall

```sh
apm uninstall save-hooks
```

## License

`MIT`
