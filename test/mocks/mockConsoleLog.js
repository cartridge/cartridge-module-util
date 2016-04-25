var fs = require('fs');
var util = require('util');
var path = require('path');

var logToFileApi = {};

var _logFilePath = path.join(__dirname, 'console.log');
var _originalMethod;
var _fileStream;
var _options;

logToFileApi.enable = function(options) {
	_options = options || {};
	_originalMethod = console.log;
	_fileStream = fs.createWriteStream(_logFilePath, {flags : 'w'});

	console.log = function(data) {
		if(_options.writeToFile) {
			_fileStream.write(util.format(data) + '\n');
		}
	}
}

logToFileApi.getFileContents = function() {
	return fs.readFileSync(_logFilePath, 'utf8');
}

logToFileApi.removeLogFile = function() {
	fs.unlinkSync(_logFilePath);
}

logToFileApi.restore = function() {
	if(!_originalMethod) {
		return;
	}

	if(_options.writeToFile) {
		_fileStream.end();
	}
	console.log = _originalMethod
}

module.exports = logToFileApi;