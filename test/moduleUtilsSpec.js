var fs = require('fs');
var path = require('path');

var chai = require('chai');
var expect = chai.expect;
var mockPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, './mockPackageConfig.json'), 'utf8'));
var moduleUtils = require('../index.js');
var moduleUtilsInstance = moduleUtils(mockPackageJson);

var mockConsoleLog = require('./mockConsoleLog');
var mockProcessExit = require('./mockProcessExit');

chai.use(require('chai-fs'));
chai.should();

describe('As user of the module utils module', function() {

	it('should export a function', function() {
		expect(moduleUtils).to.be.an('function');
	})

	describe('When creating an instance', function() {

		it('should return an object', function() {
			expect(moduleUtilsInstance).to.be.an('object');
		})
	})

	describe('When using the logMessage function', function() {

		before(function() {
			mockConsoleLog.enable({
				writeToFile: true
			});
		})

		after(function() {
			mockConsoleLog.removeLogFile();
		})

		it('should correctly log the input', function() {
			var logInput = "Who are the patriots?"
			var expected = fs.readFileSync(path.join(__dirname, 'structs', 'logMessage.txt'), 'utf8');
			var actual;

			moduleUtilsInstance.logMessage(logInput);
			mockConsoleLog.restore();
			actual = mockConsoleLog.getFileContents();

			expect(expected).to.equal(actual);
		});

	})


	describe('When using the finishInstall function', function() {

		describe('And testing the on-screen output', function() {
			before(function() {
				mockConsoleLog.enable({
					writeToFile: true
				});

				mockProcessExit.enable();
			})

			after(function() {
				mockConsoleLog.removeLogFile();
			})

			it('should correctly log the input', function() {
				var expected = fs.readFileSync(path.join(__dirname, 'structs', 'finishInstall.txt'), 'utf8');
				var actual;

				moduleUtilsInstance.finishInstall();
				mockConsoleLog.restore();
				mockProcessExit.restore();
				actual = mockConsoleLog.getFileContents();

				expect(expected).to.equal(actual);
			})
		})

		describe('And testing if the process it exited', function() {
			before(function() {
				mockProcessExit.enable();
				mockConsoleLog.enable();
			})

			after(function() {
				mockProcessExit.restore();
			})

			it('should exit the process with error code 0 (no error)', function() {
				var exitCallInfo;

				moduleUtilsInstance.finishInstall();
				mockConsoleLog.restore();

				exitCallInfo = mockProcessExit.callInfo();

				expect(exitCallInfo.called).to.be.true;
				expect(exitCallInfo.errorCode).to.equal(0);
			})

		})

	})
})