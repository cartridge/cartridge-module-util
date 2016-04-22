var mockProcessExitApi = {};

var _originalProcessExit;

mockProcessExitApi.enable = function() {
	_originalProcessExit = process.exit;

	process.exit = function() {
		return false;
	}
}

mockProcessExitApi.restore = function() {
	process.exit = _originalProcessExit;
}

module.exports = mockProcessExitApi;