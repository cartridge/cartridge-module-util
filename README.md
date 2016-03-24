# Cartridge Module Utilities [![Build Status](https://travis-ci.org/cartridge/cartridge-module-util.svg?branch=master)](https://travis-ci.org/cartridge/cartridge-module-util)

This package contains several methods used by Cartridge modules when installing

## Usage
When required the module returns a function that expects one argument, an object containing the contents of the calling modules package.json.
The function returns the api that Cartridge modules can use

### Example useage

```javascript
var packageConfig = require('../package.json');
var cartridgeUtil = require('cartridge-module-util')(packageConfig);
```

## Api

### ensureCartridgeExists
Validates that a `.cartridgerc` file exists in the current working directory. Exits the process if the file does not exist.

### addToRc

Adds the module information to the project `.cartridgerc` file. Will update the existing entry if one exists rather than adding a second.

Returns a promise that is fulfilled once the `.cartridgerc` file is written.

#### Example
```javascript
cartridgeUtil.addToRc()
	.then(function() {
		// Code to run after completion
	})
```

### removeFromRc
> TODO: Needs implementing

### modifyProjectConfig
> TODO: Add documentation

### addModuleConfig
Moves a configuration file from the module directory to the configuration directory of the project. Returns a promise on completion.

#### Arguments
| Name        | Type        | description                    |
| ----------- |:----------- |:------------------------------:|
| filePath    | String      | Path to the configuration file |

#### Example
```javascript
cartridgeUtil.addModuleConfig(path.resolve('_config', 'task.sass.js'));
```

### removeModuleConfig
> TODO: Needs implementing

### finishInstall
> TODO: Add documentation

### logMessage
Log a message out to the console.

> TODO: Move away from `console.log` to an approach that ties in to how verbose the install is set to

#### Arguments
| Name        | Type        | description                     |
| ----------- |:----------- |:-------------------------------:|
| message     | String      | Message to be displayed on the command line |

#### Example
```javascript
cartridgeUtil.logMessage('Show me on the command line!');
```
