var fs = require('fs-extra');
var path = require('path');

var _testDirectory = "";
var testUtilsApi = {};

var paths = {}

function getPathsObject() {
	return {
		structs: path.join(_testDirectory, 'structs'),
		stubs: path.join(_testDirectory, 'stubs'),
		mockProject: path.join(__dirname, 'mock-project')
	}
}

testUtilsApi.setTestDir = function(testDir) {
	_testDirectory = testDir;
}

testUtilsApi.readJsonFile = function(directory, file) {
	var filePath = path.join(directory, file);
	var fileContents = fs.readFileSync(filePath, 'utf8')

	return JSON.parse(fileContents);
}

testUtilsApi.readFile = function(directory, file) {
	var filePath = path.join(directory, file)
	var fileContents = fs.readFileSync(filePath, 'utf8');

	return fileContents;
}

testUtilsApi.getPaths = getPathsObject;

module.exports = testUtilsApi