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
	cartridge: path.resolve('../../_cartridge')
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
	cartridgeApi.removeFromRc = function removeFromRc(moduleName) {
		// TODO: implement
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

	// Remove configuration files from the project _config directory for this module
	cartridgeApi.removeModuleConfig = function removeModuleConfig() {
		// TODO: implement
	};

	cartridgeApi.finishInstall = function finishInstall(packageDetails) {
		cartridgeApi.logMessage('Finished post install of ' + packageConfig.name);
		process.exit(0);
	};

	cartridgeApi.logMessage = function logMessage(message) {
		console.log(message);
	};

	return cartridgeApi;
};
