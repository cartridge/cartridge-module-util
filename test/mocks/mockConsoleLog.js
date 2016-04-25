var fs = require('fs');
var util = require('util');
var path = require('path');

var mockConsoleLogApi = {};

var _logFilePath = path.join(__dirname, 'console.log');
var _originalMethod;
var _originalMethodError;
var _logData = [];

mockConsoleLogApi.enable = function() {
	_originalMethod = console.log;
	_originalMethodError = console.error;

	console.log = function(data) {
		_logData.push(util.format(data) + '\n');
	}

	console.error = function(data) {
		_logData.push(util.format(data) + '\n');
	}
}

mockConsoleLogApi.getLogData = function() {
	return _logData.join('');
}

mockConsoleLogApi.clearLogData = function() {
	_logData.length = 0;
}

mockConsoleLogApi.restore = function() {
	if(!_originalMethod) {
		return;
	}

	console.log = _originalMethod;
	console.error = _originalMethodError;
}

module.exports = mockConsoleLogApi;