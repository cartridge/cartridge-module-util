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
- [addToPackage](#addToPackage)
- [cleanExpansionPack](#cleanExpansionPack)
- [installDependencies](#installDependencies)


### <a name="addModuleConfig"></a> addModuleConfig
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


### <a name="addToRc"></a> addToRc

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


### <a name="copyFileToProject"></a> copyFileToProject
> TODO: Add documentation

-------


### <a name="copyToProjectDir"></a> copyToProjectDir
> TODO: Add documentation


-------


### <a name="ensureCartridgeExists"></a> ensureCartridgeExists
Validates that a `.cartridgerc` file exists in the current working directory. Exits the process if the file does not exist.

#### Example

```javascript
cartridgeUtil.ensureCartridgeExists();
```

-------


### <a name="exitIfDevEnvironment"></a> exitIfDevEnvironment
Stop execution with a non-error exit code if `NODE_ENV` environment variable equals `development`. This can be used to stop certain steps from running such as post install scripts, when developing, running CI builds etc.

* `export NODE_ENV=development` in a command line window before running `cartridgeUtil.exitIfDevEnvironment()` will exit out.
* `export NODE_ENV=production` in a command line window before running `cartridgeUtil.exitIfDevEnvironment()` will continue execution unaffected.

#### Example

```javascript
cartridgeUtil.exitIfDevEnvironment();
```

-------


### <a name="finishInstall"></a> finishInstall
Logs out a message that the installation has finished and exits the process with a success status.


-------


### <a name="logMessage"></a> logMessage
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


### <a name="modifyProjectConfig"></a> modifyProjectConfig
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


### <a name="removeFromProjectDir"></a> removeFromProjectDir
> TODO: Add documentation


-------


### <a name="removeFromRc"></a> removeFromRc
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


### <a name="removeModuleConfig"></a> removeModuleConfig
> TODO: Needs implementing

-------


### <a name="addToPackage"></a> cartridgeUtil.addToPackage(dependencyObject, dependencyString)
Add extra dependencies to the `dependency` object in cartridge project `package.json`.
The dependencies to add must be stored in the module's `package.json` as a seperate key.

#### dependencyObject `object`
Object of the dependencies to add

#### dependencyString `string`
The string of the key of the dependencies e.g. `newDependenciesToAddTo`

#### Example

```js
//package.json
{
	"dependencies": { ... }
	"newDependenciesToAddTo": {
		"dep1": "0.0.1",
		"dep2": "0.0.2"
	}
}
```

```javascript
//Package json will need to be read seperately
cartridgeUtil.addToPackage(newDependenciesToAddToObject, 'newDependenciesToAddTo')
	.then(function() {
		// Code to run after completion
	})
```

-------


### <a name="cleanExpansionPack"></a> cleanExpansionPack
> TODO: Needs implementing

-------


### <a name="installDependencies"></a> installDependencies
> TODO: Needs implementing

-------

## Development

Please follow the instructions within the [base module development guide](https://github.com/cartridge/base-module/wiki/Development-guide) when working on this project.

### Testing

When adding functionality or modifying existing methods you should add unit tests to cover the change. In addition the tests should be run to ensure that existing functionality hasn't been modified. The tests are run with the following command:

```bash
mocha
```

Alternatively both the tests and linting can be run with the following command:

```bash
npm test
```

To check the code coverage of the current tests run

```bash
npm run cover
```

Please make sure that your changes either increase the test coverage or at least maintain the same coverage.
