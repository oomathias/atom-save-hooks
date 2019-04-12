# Changelog

## [Unreleased]

## [1.0.0] - 2019-04-12

### Changed

- Change configuration file name (support for multiple IDE)
  - package.json: `atom-save-hooks` -> `on-save`
  - rc: `.atomsavehooksrc` -> `.onsaverc`
  - js: `atom-save-hooks.config.js` -> `on-save.config.js`

### Added

- Documentation

### Fixed

- Allow non glob matcher (ie: package.json)
- Config cache
- Linting

## [0.1.1] - 2019-03-14

### Added

- Documentation

### Fixed

- standard -> prettier
- Fix invalid config message

## [0.1.0] - 2019-03-14

### Added

- Initial save-hooks

[unreleased]: https://github.com/oomathias/atom-save-hooks/compare/v0.1.0.0...master
[1.0.0]: https://github.com/oomathias/atom-save-hooks/releases/tag/v1.0.0
[0.1.1]: https://github.com/oomathias/atom-save-hooks/releases/tag/v0.1.1
[0.1.0]: https://github.com/oomathias/atom-save-hooks/releases/tag/v0.1.0
