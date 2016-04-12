'use strict';

var CONFIG_FILE = '/.cartridgerc';
var MATCH_REGEX = /(\[\/\/\]: <> \(Modules start\)\s)([^[]*)(\[\/\/\]: <> \(Modules end\)\s)/g;

var del      = require('del');
var path     = require('path');
var chalk    = require('chalk');
var template = require('lodash/template');
var Promise  = require('bluebird');
var fs       = Promise.promisifyAll(require('fs-extra'));
var inArray = require('in-array');

var paths = {
	project:   path.resolve('../../'),
	config:    path.resolve('../../', '_config'),
	readme:    path.resolve('../../', 'readme.md'),
	cartridge: path.resolve('../../_cartridge'),
	pkg: 			 path.resolve('../../', 'package.json')
};


// Checks if the project has been set up with Cartridge
function hasCartridgeInstalled() {
	try {
		fs.accessSync(paths.project + CONFIG_FILE, fs.R_OK | fs.W_OK);
	} catch(err) {
		return false;
	}

	return true;
}

function insertModulesInToReadme(readmeContents) {
	return readmeContents.replace(MATCH_REGEX, this.renderedModules);
}

function updateReadme(renderedModuleTemplate) {

	return fs.readFileAsync(paths.readme, 'utf8')
		.bind({
			renderedModules: renderedModuleTemplate
		})
		.then(insertModulesInToReadme)
		.then(function(fileContent){
			return fs.writeFileAsync(paths.readme, fileContent)
		})
		.catch(function(err) {
			console.log('updateReadme error');
			console.error(err);
			process.exit(1);
		});
}

function updateJsonObj(obj, newObj){
	for (var key in newObj) {
    obj[key] = newObj[key];
	}
	return obj;
}

function compileTemplate(rawTemplate) {
	var compiledTemplate = template(rawTemplate);

	return compiledTemplate(this)
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
			process.exit(1);
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

		if(modules[i].name == moduleName) {
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
	for (var i = 0; i < data.modules.length; i++) {
		if(data.modules[i].name === moduleName) {
			data.modules.splice(i, 1);
		}
	}

	return data;
}

function addModule(rcContent) {
	// This is bound to the module data
	var i, moduleIndex;

	// Check if any modules have been added to the rc yet
	if(!rcContent.hasOwnProperty('modules')) {
		// No so create the array
		rcContent.modules = [];
		moduleIndex = 0;
	} else {
		moduleIndex = getModuleId(rcContent.modules, this.name);
	}

	// Set the data
	rcContent.modules[moduleIndex] = this;

	return rcContent;
}

function writeJsonFile(fileContent) {
	return fs.writeJsonAsync(this, fileContent)
		.then(function(){
			return fileContent;
		});
}

module.exports = function(packageConfig) {
	var cartridgeApi = {};

	function _copyToProjectDir(packageName, copyPath, destinationPath) {
		var fullFileName = path.basename(copyPath);
		var projectDestinationDirectory = (destinationPath) ? path.join(paths.project, destinationPath) : paths.project;
		var destinationFileList = fs.readdirSync(projectDestinationDirectory);
		var projectDestinationPath = path.join(projectDestinationDirectory, fullFileName);
		var fileAlreadyExists = inArray(destinationFileList, fullFileName);

		if(fileAlreadyExists) {
			cartridgeApi.logMessage('Skipping: Copying ' + fullFileName + ' file as it already exists');
			return Promise.resolve();
		}

		return fs.copyAsync(copyPath, projectDestinationPath)
			.then(function(){
				cartridgeApi.logMessage('Finished: Copying ' + fullFileName + ' for ' + packageName + '');
				return Promise.resolve();
			});
	}

	function _removeFromProjectDir(removePath, packageName) {
		var fullFileName = path.basename(removePath);
		var projectRemovePath = path.join(paths.project, removePath);

		return fs.removeAsync(projectRemovePath)
			.then(function(){
				cartridgeApi.logMessage('Finished: Removing ' + fullFileName + ' for ' + packageName + '');
				return Promise.resolve();
			});
	}

	cartridgeApi.exitIfDevEnvironment = function() {
		if(process.env.NODE_ENV === 'development') {

			cartridgeApi.logMessage('NODE_ENV is set to ' + chalk.underline('development'));
			cartridgeApi.logMessage('Skipping postinstall.js for ' + chalk.underline(packageConfig.name));
			cartridgeApi.logMessage('');

			process.exit(0);
		}
	}

	cartridgeApi.ensureCartridgeExists = function ensureCartridgeExists() {
		if(!hasCartridgeInstalled()) {
			console.error(chalk.red('Cartridge is not set up in this directory. Please set it up first before installing this module'));
			process.exit(1);
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
				process.exit(1);
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
				process.exit(1);
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
				process.exit(1);
			});
	};

	// Add configuration files to the project _config directory for this module
	cartridgeApi.addModuleConfig = function addModuleConfig(configPath) {
		var configFileName = path.basename(configPath)
		var toPath = path.join(paths.config, configFileName);
		var destinationFileList = fs.readdirSync(paths.config);
		var configFileExists = inArray(destinationFileList, configFileName);

		if(configFileExists) {
			cartridgeApi.logMessage('Skipping: Copying config file as it already exists');
			return Promise.resolve();
		}

		return fs.copyAsync(configPath, toPath)
			.then(function(){
				cartridgeApi.logMessage('Finished: adding ' + packageConfig.name + ' config files');
				return Promise.resolve();
			});
	};

	cartridgeApi.copyToProjectDir = function copyToProjectDir(fileList) {
		var copyTasks = [];

		for (var i = 0; i < fileList.length; i++) {
			copyTasks.push(_copyToProjectDir(packageConfig.name, fileList[i].copyPath, fileList[i].destinationPath));
		}

		return Promise.all(copyTasks);
	}

	// Remove configuration files from the project _config directory for this module
	cartridgeApi.removeModuleConfig = function removeModuleConfig(configPath) {
		var configFileName = path.basename(configPath)
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

	cartridgeApi.addToPackage = function addToPackage(objToAdd){
		//get package.json
		var pkg = {};
		return fs.readJsonAsync(paths.pkg)
			.then(function(data){
				pkg = data;
				return updateJsonObj(data.dependencies, objToAdd);
			})
			.then(function(newPkg){
				//update file with new values
				pkg.dependencies = newPkg;
				writeJsonFile(pkg);
			})
			.then(function(){
				cartridgeApi.logMessage('Finished: modifying package.json for ' + packageConfig.name);
				return Promise.resolve();
			})
			.catch(function(err){
				console.log('modifyPackageJson error');
				console.error(err);
				process.exit(1);
			});
	}

	cartridgeApi.finishInstall = function finishInstall(packageDetails) {
		cartridgeApi.logMessage('Finished: post install of ' + packageConfig.name);
		process.exit(0);
	};

	cartridgeApi.finishUninstall = function finishUninstall(packageDetails) {
		cartridgeApi.logMessage('Finished: post uninstall of ' + packageConfig.name);
		process.exit(0);
	};

	cartridgeApi.logMessage = function logMessage(message) {
		console.log(message);
	};

	return cartridgeApi;
};
