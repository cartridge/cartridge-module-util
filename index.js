'use strict';

var CONFIG_FILE = '/.cartridgerc';
var MATCH_REGEX = /(\[\/\/\]: <> \(Modules start\)\s)([^[]*)(\[\/\/\]: <> \(Modules end\)\s)/g;

var EXIT_OK   = 0;
var EXIT_FAIL = 1;

var path       = require('path');
var chalk      = require('chalk');
var template   = require('lodash/template');
var Promise    = require('bluebird');
var fs         = Promise.promisifyAll(require('fs-extra'));
var pathExists = require('path-exists');
var npmInstallPackage = require('npm-install-package');
var process = require('process');

var paths = {
	project:   path.resolve('../../'),
	config:    path.resolve('../../', '_config'),
	readme:    path.resolve('../../', 'readme.md'),
	cartridge: path.resolve('../../_cartridge'),
	pkg: 			 path.resolve('../../', 'package.json')
};


// Checks if the project has been set up with Cartridge
function hasCartridgeInstalled() {
	return pathExists.sync(paths.project + CONFIG_FILE);
}

function insertModulesInToReadme(readmeContents) {
	/* jshint validthis:true */
	// In this instance this has been bound by updateReadme to be the rendered module table HTML
	return readmeContents.replace(MATCH_REGEX, this.renderedModules);
	/* jshint validthis:false */
}

function updateReadme(renderedModuleTemplate) {

	return fs.readFileAsync(paths.readme, 'utf8')
		.bind({
			renderedModules: renderedModuleTemplate
		})
		.then(insertModulesInToReadme)
		.then(function(fileContent){
			return fs.writeFileAsync(paths.readme, fileContent);
		})
		.catch(function(err) {
			console.log('updateReadme error');
			console.error(err);
			process.exit(EXIT_FAIL);
		});
}

function updateJsonObj(obj, newObj, ignoreArr){
	for (var key in newObj) {
		if (newObj.hasOwnProperty(key)) {
			for(var i = 0; i < ignoreArr.length; i++){
				if(key !== ignoreArr[i]){
		    	obj[key] = newObj[key];
		  	}
	  	}
	  }
	}
	return obj;
}

function removeDependency(obj, match){

	for (var key in obj) {
		if(key === match)
	    delete obj[key];
		}
	return obj;
}

function jSonObjToNpmInstallArray(newObj, ignoreArr){
	var npmArray = [];
	for (var key in newObj) {
		if (newObj.hasOwnProperty(key)) {
			for(var i = 0; i < ignoreArr.length; i++){

				if(key !== ignoreArr[i]){
					if (newObj.hasOwnProperty(key)) {
		        npmArray.push(key);
		    	}
		    }
	  	}
	  }
	}
	return npmArray;
}

function compileTemplate(rawTemplate) {
	var compiledTemplate = template(rawTemplate);


	/* jshint validthis:true */
	// In this instance this has been bound by updateReadmeModules to be the contents of the cartridgeRc
	return compiledTemplate(this);
	/* jshint validthis:false */
}

function updateReadmeModules(rcData) {
	var filePath = path.join(paths.cartridge, 'modules.tpl');

	return fs.readFileAsync(filePath, 'utf8')
		.bind(rcData)
		.then(compileTemplate)
		.then(updateReadme)
		.catch(function(err){
			console.log('updateReadmeModules error');
			console.error(err);
			console.trace();
			process.exit(EXIT_FAIL);
		});
}

function ensureProjectConfigPaths(projectConfig) {
	if(!projectConfig.hasOwnProperty('paths')) {
		projectConfig.paths = {
			src:   {},
			dest: {}
		};
	}

	if(!projectConfig.paths.hasOwnProperty('src')) {
		projectConfig.paths.src = {};
	}

	if(!projectConfig.paths.hasOwnProperty('dest')) {
		projectConfig.paths.dest = {};
	}

	return projectConfig;
}

function getModuleId(modules, moduleName) {
	var i, moduleIndex;

	// Yes so check that this one doesn't already exist
	for(i = 0; i < modules.length; i++) {

		if(modules[i].name === moduleName) {
			moduleIndex = i;
			break;
		}
	}

	if(moduleIndex === undefined) {
		moduleIndex = modules.length;
	}

	return moduleIndex;
}

function removeModuleDataFromRcObject(data, moduleName) {
	var deleteLength = 1;
	for (var i = 0; i < data.modules.length; i++) {
		if(data.modules[i].name === moduleName) {
			data.modules.splice(i, deleteLength);
		}
	}

	return data;
}

function addModule(rcContent) {
	// This is bound to the module data
	var moduleIndex;

	// Check if any modules have been added to the rc yet
	if(!rcContent.hasOwnProperty('modules')) {
		// No so create the array
		rcContent.modules = [];
		moduleIndex = 0;
	} else {
		/* jshint validthis:true */
		// In this instance this has been bound by addToRc to be the object containing the module information
		moduleIndex = getModuleId(rcContent.modules, this.name);
		/* jshint validthis:false */
	}

	// Set the data
	/* jshint validthis:true */
	// In this instance this has been bound by addToRc to be the object containing the module information
	rcContent.modules[moduleIndex] = this;
	/* jshint validthis:false */

	return rcContent;
}

function writeJsonFile(fileContent) {
	/* jshint validthis:true */
	// In this instance this has been bound by the calling function to be the path of the JSON file
	return fs.writeJsonAsync(this, fileContent)
	/* jshint validthis:false */
		.then(function(){
			return fileContent;
		});
}

module.exports = function(packageConfig) {
	var cartridgeApi = {};

	function _removeFromProjectDir(removePath, packageName) {
		var fullFileName = path.basename(removePath);
		var projectRemovePath = path.join(paths.project, removePath);

		return fs.removeAsync(projectRemovePath)
			.then(function(){
				cartridgeApi.logMessage('Finished: Removing ' + fullFileName + ' for ' + packageName + '');
				return Promise.resolve();
			});
	}

	cartridgeApi.logMessage = function logMessage(message) {
		console.log(message);
	};

	cartridgeApi.copyFileToProject = function copyFileToProject(copyPath, destinationPath) {
		var fileName, destinationFile;

		destinationPath = (destinationPath) ? path.join(paths.project, destinationPath) : paths.project;
		fileName        = path.basename(copyPath);
		destinationFile = path.join(destinationPath, fileName);

		if(pathExists.sync(destinationFile)) {
			cartridgeApi.logMessage('Skipping: Copying ' + fileName + ' file as it already exists');
			return Promise.resolve();
		}

		return fs.ensureDirAsync(destinationPath)
			.then(function() {
				return fs.copyAsync(copyPath, destinationFile);
			})
			.then(function(){
				cartridgeApi.logMessage('Finished: Copying ' + fileName + ' for ' + packageConfig.name + '');
				return Promise.resolve();
			});
	};

	cartridgeApi.exitIfDevEnvironment = function() {
		if(process.env.NODE_ENV === 'development') {

			cartridgeApi.logMessage('NODE_ENV is set to ' + chalk.underline('development'));
			cartridgeApi.logMessage('Skipping postinstall.js for ' + chalk.underline(packageConfig.name));
			cartridgeApi.logMessage('');

			process.exit(EXIT_OK);
		}
	};

	cartridgeApi.ensureCartridgeExists = function ensureCartridgeExists() {
		if(!hasCartridgeInstalled()) {
			console.error(chalk.red('Cartridge is not set up in this directory. Please set it up first before installing this module'));
			process.exit(EXIT_FAIL);
		}
	};

	// Adds the specified module to the .cartridgerc file
	cartridgeApi.addToRc = function addToRc() {
		var filePath = path.join(paths.project,  CONFIG_FILE);

		var moduleConfig = {
			name:    packageConfig.name,
			version: packageConfig.version,
			site:    packageConfig.homepage,
			task:    packageConfig.name + '/' + packageConfig.main
		};

		cartridgeApi.logMessage('Adding ' + packageConfig.name + ' to .cartridgerc');

		return fs.readJsonAsync(filePath)
			.bind(moduleConfig)
			.then(addModule)
			.bind(filePath)
			.then(writeJsonFile)
			.then(updateReadmeModules)
			.then(function() {
				cartridgeApi.logMessage('Finished: adding ' + packageConfig.name + ' to .cartridgerc');
				return Promise.resolve();
			})
			.catch(function(err){
				console.log('addToRc error');
				console.error(err);
				process.exit(EXIT_FAIL);
			});
	};

	// Removes the specified module from the .cartridgerc file
	cartridgeApi.removeFromRc = function removeFromRc() {
		var filePath = path.join(paths.project,  CONFIG_FILE);

		cartridgeApi.logMessage('Removing ' + packageConfig.name + ' from .cartridgerc');

		return fs.readJsonAsync(filePath)
			.then(function(data) {
				return removeModuleDataFromRcObject(data, packageConfig.name);
			})
			.bind(filePath)
			.then(writeJsonFile)
			.then(updateReadmeModules)
			.then(function() {
				cartridgeApi.logMessage('Finished: Removing ' + packageConfig.name + ' from .cartridgerc');
				return Promise.resolve();
			})
			.catch(function(err){
				console.log('removeFromRc error');
				console.error(err);
				process.exit(EXIT_FAIL);
			});
	};

	// Modify the project configuration (project.json) with a transform function
	cartridgeApi.modifyProjectConfig = function modifyProjectConfig(transform) {
		var filePath = path.join(paths.config,  '/project.json');

		cartridgeApi.logMessage('Updating project config for ' + packageConfig.name);

		return fs.readJsonAsync(paths.config + '/project.json')
			.then(ensureProjectConfigPaths)
			.then(transform)
			.bind(filePath)
			.then(writeJsonFile)
			.then(function(){
				cartridgeApi.logMessage('Finished: modifying project config for ' + packageConfig.name);
				return Promise.resolve();
			})
			.catch(function(err){
				console.log('modifyProjectConfig error');
				console.error(err);
				process.exit(EXIT_FAIL);
			});
	};

	// Add configuration files to the project _config directory for this module
	cartridgeApi.addModuleConfig = function addModuleConfig(configPath) {
		return cartridgeApi.copyFileToProject(configPath, '_config');
	};

	cartridgeApi.copyToProjectDir = function copyToProjectDir(fileList) {
		var copyTasks = [];

		for (var i = 0; i < fileList.length; i++) {
			copyTasks.push(cartridgeApi.copyFileToProject(fileList[i].copyPath, fileList[i].destinationPath));
		}

		return Promise.all(copyTasks);
	};

	// Remove configuration files from the project _config directory for this module
	cartridgeApi.removeModuleConfig = function removeModuleConfig(configPath) {
		var configFileName          = path.basename(configPath);
		var projectModuleConfigPath = path.join(paths.config, configFileName);

		return fs.removeAsync(projectModuleConfigPath)
			.then(function(){
				cartridgeApi.logMessage('Finished: Removed ' + packageConfig.name + ' config files');
				return Promise.resolve();
			});
	};

	cartridgeApi.removeFromProjectDir = function removeFromProjectDir(fileList) {
		var removeTasks = [];

		for (var i = 0; i < fileList.length; i++) {
			removeTasks.push(_removeFromProjectDir(fileList[i], packageConfig.name));
		}

		return Promise.all(removeTasks);
	}

	cartridgeApi.addToPackage = function addToPackage(objToAdd, ignoreArr){
		//get package.json
		var pkg = {};
		return fs.readJsonAsync(paths.pkg)
			.then(function(data){
				pkg = data;

				return updateJsonObj(data.dependencies, objToAdd, ignoreArr);
			})
			.then(function(newPkg){
				//update file with new values
				pkg.dependencies = newPkg;

				return fs.writeJsonAsync(paths.pkg, pkg, function (err) {
				  console.log('write json error', err)
				})
				.then(function(){
					return pkg;
				});
			})
			.then(function(){
				cartridgeApi.logMessage('Finished: modifying package.json for ' + packageConfig.name);
				return Promise.resolve();
			})
			.catch(function(err){
				console.log('modifyPackageJson error');
				console.error(err);
				process.exit(EXIT_FAIL);
			});
	};

	cartridgeApi.cleanExpansionPack = function cleanExpansionPack(){
		var pkg = {};
		return fs.readJsonAsync(paths.pkg)
			.then(function(data){
				pkg = data;
				//remove from package json
				return removeDependency(data.dependencies, packageConfig.name);
			})
			.then(function(newPkg){
				//update file with new values

				pkg.dependencies = newPkg;

				return fs.writeJsonAsync(paths.pkg, pkg, function (err) {
				  console.log('write json error', err)
				});
			})
			.then(function(){
				//remove from node modules
				return fs.removeSync(path.resolve(__dirname + '../../../../' + packageConfig.name));

			})
			.then(function(){
				cartridgeApi.logMessage('Finished: cleaned packages for ' + packageConfig.name);
				return Promise.resolve();
			})

	};

	cartridgeApi.installDependencies = function installDependencies(dependencies, ignoreArr){
		return new Promise(function (resolve){
			process.chdir('../../');
			return npmInstallPackage(jSonObjToNpmInstallArray(dependencies, ignoreArr), function(err){
				if(err) throw err;
				cartridgeApi.logMessage('Finished: installing dependencies for ' + packageConfig.name);
				resolve();
			});
		});
	};


	cartridgeApi.finishInstall = function finishInstall() {
		cartridgeApi.logMessage('Finished: post install of ' + packageConfig.name);
		process.exit(EXIT_OK);
	};

	return cartridgeApi;
};
