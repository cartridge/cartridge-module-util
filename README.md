# Cartridge Module Utilities
[![Build Status](https://img.shields.io/travis/cartridge/cartridge-module-util.svg?branch=master&style=flat-square)](https://travis-ci.org/cartridge/cartridge-module-util)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)

This package contains several methods used by Cartridge modules when installing.

## Usage
When required the module returns a function that expects one argument, an object containing the contents of the calling modules package.json.
The function returns the api that Cartridge modules can use.

### Example usage

```js
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


### <a name="addModuleConfig"></a>addModuleConfig(pathToConfigFile)
Moves a configuration file from the module directory to the configuration directory of the project. Returns a promise on completion.

#### Arguments

##### *pathToConfigFile `string`*

The path to the module config file. This is relative to the module directory.

#### Example
```js
cartridgeUtil.addModuleConfig(path.resolve('_config', 'task.sass.js'));
```


-------


### <a name="addToRc"></a>addToRc

Adds the module information to the project `.cartridgerc` file. Will update the existing entry if one exists rather than adding a second.

Returns a promise that is fulfilled once the `.cartridgerc` file is written.

#### Example
```js
cartridgeUtil.addToRc()
    .then(function() {
        // Code to run after completion
    })
```

-------


### <a name="copyFileToProject"></a>copyFileToProject(copyPath[, destinationPath])
Copy a single file / directory from the module directory to the cartridge project directory.
If the file being copied already exists in the destination path, it will skipped and not overwritten.

Returns a promise this is fulfilled once the file has been copied.

#### Arguments

##### *copyPath `string`*

The file path to copy to the project directory. This is relative to the module directory.

##### *destinationPath `string`*

Optional argument specifying where the file will be copied to.

* If provided, this is relative to the cartridge project directory. If the directory copying into does not exist, it is created before copying.
* If not provided, this defaults to the cartridge project directory root.

#### Example

```js
//File is copied to the root of the project
cartridgeUtil.copyFileToProject('file-to-copy.js');

//File is copied into the directory 'copy-directory' in the project root.
cartridgeUtil.copyFileToProject('file-to-copy.js', 'copy-directory');
```

-------


### <a name="copyToProjectDir"></a>copyToProjectDir(copyPaths)
Copy mutilpe files, directories at once.

#### Arguments

##### *copyPaths `array`*

Array containing copy and destination paths. Each index contains a `copyInfo` object, with the contents:

* `copyInfo.copyPath` - This is **required** and specifies what files or directory is to be copied. This is relative to the module directory. If the path already exists before copying it will not be overwritten.
* `copyInfo.destinationPath` - This is **optional** and specifies where in the project directory it will be copied to. If the directory does not exist, it will be created. When this is not provided it, copy destination path will default to the project directory root.

Returns a promise this is fulfilled when all copy operations have completed.

#### Example

```js
cartridgeUtil.copyToProjectDir([{
    copyPath: 'file-to-copy.js',
}, {
    copyPath: 'directory/to/copy'
}, {
    //file1.js is copied into <project-root>/test-directory
    copyPath: 'file1.js',
    destinationPath: 'test-directory'
}])
```

-------


### <a name="ensureCartridgeExists"></a>ensureCartridgeExists
Validates that a `.cartridgerc` file exists in the current working directory. Exits the process if the file does not exist.

#### Example

```js
cartridgeUtil.ensureCartridgeExists();
```

-------


### <a name="exitIfDevEnvironment"></a>exitIfDevEnvironment
Stop execution with a non-error exit code if `NODE_ENV` environment variable equals `development`. This can be used to stop certain steps from running such as post install scripts, when developing, running CI builds etc.

* `export NODE_ENV=development` in a command line window before running `cartridgeUtil.exitIfDevEnvironment()` will exit out.
* `export NODE_ENV=production` in a command line window before running `cartridgeUtil.exitIfDevEnvironment()` will continue execution unaffected.

#### Example

```js
cartridgeUtil.exitIfDevEnvironment();
```

-------


### <a name="finishInstall"></a>finishInstall
Logs out a message that the installation has finished and exits the process with a success status. This should be the last function called.


-------


### <a name="logMessage"></a>logMessage(message)
Log a message out to the console.

<!-- TODO: Move away from `console.log` to an approach that ties in to how verbose the install is set to -->

#### Arguments

##### *message `string`*

Message to be displayed on the command line

#### Example
```js
cartridgeUtil.logMessage('Show me on the command line!');
```


-------


### <a name="modifyProjectConfig"></a>modifyProjectConfig(transformFunction)
Modify the project.json config file of a project with the use of a transform function.

#### Arguments

##### *transformFunction `function`*

Function used to transform the project config.

The function should expect one argument, a javascript object representing the contents of the project.json file. It should return the modified object.

#### Example
```js
cartridgeUtil.modifyProjectConfig(function(config) {
    if(!config.paths.src.hasOwnProperty('my_module')) {
        config.paths.src.my_module = 'some/path';
    }
    return config;
});
```

-------


### <a name="removeFromProjectDir"></a>removeFromProjectDir(pathList)
Remove files or folders from the cartridge project directory. Multiple files and folders can be removed in a single call.

This can be useful when uninstalling a module in a uninstall script.

This returns a promise that is fulfilled when all paths have been removed.

#### Arguments

##### *pathList `array`*

An array with each index being the path to remove. The path should be relative to the project directory.

#### Example

```js
cartridgeUtil.removeFromProjectDir([
    'directory/to/delete',
    'file-to-delete.js'
])
```

-------


### <a name="removeFromRc"></a>removeFromRc
Remove the module information to the project `.cartridgerc` file.

Returns a promise that is fulfilled once the `.cartridgerc` file is written.

#### Example
```js
cartridgeUtil.removeFromRc()
    .then(function() {
        // Code to run after completion
    })
```

-------


### <a name="removeModuleConfig"></a>removeModuleConfig(pathToModuleConfig)

Remove the config file at the provided path.

Returns a promise that is fulfilled once the config file has been deleted.

#### Arguments

##### *pathToModuleConfig `string`*

The complete path, with the file name and extension, of the config file.

#### Example

```js
cartridgeUtil.removeModuleConfig(path.resolve('_config', 'task.' + TASK_NAME + '.js'));
```

-------


### <a name="addToPackage"></a>addToPackage(dependencies, dependenciesObjectKey)
Add extra dependencies to the `dependency` object in cartridge project `package.json`.
The dependencies to add must be stored in the module's `package.json` as a seperate key.

Returns a promise that is fulfilled once the dependencies have been added to the package.json

#### Arguments

##### *dependencies `object`*
Object of the dependencies to add

##### *dependenciesObjectKey `string`*
The string of the key of the dependencies e.g. `newDependenciesToAdd`. This string relates to the key in the package.json, seen below.

#### Example

```js
//package.json
{
    "dependencies": { ... }
    "newDependenciesToAdd": {
        "dep1": "0.0.1",
        "dep2": "0.0.2"
    }
}
```

```js
//Package json will need to be read seperately
cartridgeUtil.addToPackage(newDependenciesToAddToObject, 'newDependenciesToAdd')
    .then(function() {
        // Code to run after completion
    })
```

-------


### <a name="cleanExpansionPack"></a>cleanExpansionPack
Remove all traces of the expansion pack. Calling this function deletes the package's `node_modules` directory and removes it from the package.json `dependency` object.

Returns a promise that is fulfilled once expansion pack files have been deleted.

Due to removing all traces of the installation, this function should be the penultimate function to call, after all other setup code has run but before running `finishInstall`

#### Example

```js
cartridgeUtil.cleanExpansionPack();
```

-------


### <a name="installDependencies"></a>installDependencies(dependencies, dependenciesObjectKey)
Programmatically install npm dependencies.
The dependencies to add must be stored in the module's `package.json` as a seperate key.

Returns a promise that is fulfilled once all dependencies have been installed.

#### Arguments

##### *dependencies `object`*
Object of the dependencies to add

##### *dependenciesObjectKey `string`*
The string of the key of the dependencies e.g. `newDependenciesToAdd`. This string relates to the key in the package.json, seen below.

#### Example

```js
//package.json
{
    "dependencies": { ... }
    "newDependenciesToAdd": {
        "dep1": "0.0.1",
        "dep2": "0.0.2"
    }
}
```

```js
//Package json will need to be read seperately
cartridgeUtil.installDependencies(newDependenciesToAddObject, 'newDependenciesToAdd')
    .then(function() {
        // Code to run after completion
    })
```

-------

## Development

Please follow the instructions within the [base module development guide](https://github.com/cartridge/base-module/wiki/Development-guide) when working on this project.

### Testing

When adding functionality or modifying existing methods you should add unit tests to cover the change. In addition the tests should be run to ensure that existing functionality hasn't been modified. The tests are run with the following command:

```sh
mocha
```

Alternatively both the tests and linting can be run with the following command:

```sh
npm test
```

To check the code coverage of the current tests run

```sh
npm run cover
```

Please make sure that your changes either increase the test coverage or at least maintain the same coverage.
