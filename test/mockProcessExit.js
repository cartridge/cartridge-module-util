var mockProcessExitApi = {};

var _originalProcessExit;
var _hasBeenCalled = false;
var _errorCode;

mockProcessExitApi.enable = function() {
	_originalProcessExit = process.exit;

	process.exit = function(errorCode) {
		_errorCode = errorCode;

		if(!_hasBeenCalled) {
			_hasBeenCalled = true;
		}
	}
}

mockProcessExitApi.callInfo = function() {
	return {
		called: true,
		errorCode: _errorCode
	};
}

mockProcessExitApi.restore = function() {
	process.exit = _originalProcessExit;
	_hasBeenCalled = false;
}

module.exports = mockProcessExitApi;