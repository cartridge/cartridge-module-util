var fs = require('fs');
var util = require('util');
var path = require('path');

var mockConsoleLogApi = {};

var _logFilePath = path.join(__dirname, 'console.log');
var _originalMethod;
var _fileStream;
var _options;
var _logData = [];

mockConsoleLogApi.enable = function(options) {
	_options = options || {};
	_originalMethod = console.log;
	_fileStream = fs.createWriteStream(_logFilePath, {flags : 'w'});

	console.log = function(data) {
		if(_options.writeToFile) {
			_fileStream.write(util.format(data) + '\n');
		}

		_logData.push(util.format(data) + '\n');
	}
}

mockConsoleLogApi.getFileContents = function() {
	return fs.readFileSync(_logFilePath, 'utf8');
}

mockConsoleLogApi.getLogData = function() {
	return _logData.join('');
}

mockConsoleLogApi.clearLogData = function() {
	_logData.length = 0;
}

mockConsoleLogApi.removeLogFile = function() {
	fs.unlinkSync(_logFilePath);
}

mockConsoleLogApi.restore = function() {
	if(!_originalMethod) {
		return;
	}

	if(_options.writeToFile) {
		_fileStream.end();
	}
	console.log = _originalMethod
}

module.exports = mockConsoleLogApi;