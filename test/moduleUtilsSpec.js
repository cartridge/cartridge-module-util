var fs = require('fs');
var path = require('path');

var chai = require('chai');
var expect = chai.expect;
var mockPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, './mockPackageConfig.json'), 'utf8'));
var moduleUtils = require('../index.js');
var moduleUtilsInstance = moduleUtils(mockPackageJson);

var consoleLogToFile = require('./consoleLogToFile');

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
			consoleLogToFile.enable();
		})

		after(function() {
			consoleLogToFile.removeLogFile();
		})

		it('should correctly log the input', function() {
			var logInput = "Who are the patriots?"
			var expected = fs.readFileSync(path.join(__dirname, 'structs', 'logMessage.txt'), 'utf8');
			var actual;

			moduleUtilsInstance.logMessage(logInput);
			consoleLogToFile.restore();
			actual = consoleLogToFile.getFileContents();

			expect(expected).to.equal(actual);
		});

	})


	describe('When using the finishInstall function', function() {

		before(function() {
			consoleLogToFile.enable();

			process.exit = function() {
				return false;
			}
		})

		after(function() {
			consoleLogToFile.removeLogFile();
		})

		it('should correctly log the input', function() {
			var expected = fs.readFileSync(path.join(__dirname, 'structs', 'finishInstall.txt'), 'utf8');
			var actual;

			moduleUtilsInstance.finishInstall();
			consoleLogToFile.restore();
			actual = consoleLogToFile.getFileContents();

			expect(expected).to.equal(actual);
		})
	})

})