# Cartridge Module Utilities
[![Build Status](https://img.shields.io/travis/cartridge/cartridge-module-util.svg?branch=master&style=flat-square)](https://travis-ci.org/cartridge/cartridge-module-util)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)

This package contains several methods used by Cartridge modules when installing.

## Usage
When required the module returns a function that expects one argument, an object containing the contents of the calling modules package.json.
The function returns the api that Cartridge modules can use.

### Example usage

```javascript
var packageConfig = require('../package.json');
var cartridgeUtil = require('cartridge-module-util')(packageConfig);
```

API
-------
- [addModuleConfig](#addModuleConfig)
- [addToRc](#addToRc)
- [copyFileToProject](#copyFileToProject)
- [copyToProjectDir](#copyToProjectDir)
- [ensureCartridgeExists](#ensureCartridgeExists)
- [exitIfDevEnvironment](#exitIfDevEnvironment)
- [finishInstall](#finishInstall)
- [logMessage](#logMessage)
- [modifyProjectConfig](#modifyProjectConfig)
- [removeFromProjectDir](#removeFromProjectDir)
- [removeFromRc](#removeFromRc)
- [removeModuleConfig](#removeModuleConfig)


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


-------


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

-------


### copyFileToProject
> TODO: Add documentation

-------


### copyToProjectDir
> TODO: Add documentation


-------


### ensureCartridgeExists
Validates that a `.cartridgerc` file exists in the current working directory. Exits the process if the file does not exist.

#### Example

```javascript
cartridgeUtil.ensureCartridgeExists();
```

-------


### exitIfDevEnvironment
Stop execution with a non-error exit code if `NODE_ENV` environment variable equals `development`. This can be used to stop certain steps from running such as post install scripts, when developing, running CI builds etc.

* `export NODE_ENV=development` in a command line window before running `cartridgeUtil.exitIfDevEnvironment()` will exit out.
* `export NODE_ENV=production` in a command line window before running `cartridgeUtil.exitIfDevEnvironment()` will continue execution unaffected.

#### Example

```javascript
cartridgeUtil.exitIfDevEnvironment();
```

-------


### finishInstall
Logs out a message that the installation has finished and exits the process with a success status.


-------


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


-------


### modifyProjectConfig
Modify the project.json config file of a project with the use of a transform function.

#### Arguments
| Name        | Type        | description                     |
| ----------- |:----------- |:-------------------------------:|
| transform   | function    | Function used to transform the project config |

The function should expect one argument, a javascript object representing the contents of the project.json file. It should return the modified object.

#### Example
```javascript
cartridgeUtil.modifyProjectConfig(function(config) {
	if(!config.paths.src.hasOwnProperty('my_module')) {
		config.paths.src.my_module = 'some/path';
	}
	return config;
});
```

-------


### removeFromProjectDir
> TODO: Add documentation


-------


### removeFromRc
Remove the module information to the project `.cartridgerc` file.

Returns a promise that is fulfilled once the `.cartridgerc` file is written.

#### Example
```javascript
cartridgeUtil.removeFromRc()
	.then(function() {
		// Code to run after completion
	})
```

-------


### removeModuleConfig
> TODO: Needs implementing


### ESLint
By default `index.js` is linted using ESLint. These checks are run by travis and will fail the build if errors are found.

To manually check for errors run
```sh
npm run lint
```

If you are getting an error that you don't understand then try looking at the [JSLint Error Explanations](http://jslinterrors.com/) site or the [ESLint rules page](http://eslint.org/docs/rules/). The linting rules are in place for a reason. If you have a specific use case where you need to violate one then disable the linter in place rather than removing the rule. In addition leave a comment explaining the reasoning for disabling the linter.
```javascript
/*eslint no-extend-native: "off"*/
// We are polyfilling native functionality for older browsers
if (!Element.prototype.addEventListener) {
	Element.prototype.removeEventListener = function (sEventType, fListener) {
		...
	}
}
/*eslint no-extend-native: "error"*/
```
If you add further JavaScript files to this module then please add them to the linting command defined in `package.json`.
