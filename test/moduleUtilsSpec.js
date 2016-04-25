var fs = require('fs-extra');
var path = require('path');

var chai = require('chai');
var stripAnsi = require('strip-ansi');
var rewire =  require('rewire')
var expect = chai.expect;
var mockPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, './mocks/mockPackageConfig.json'), 'utf8'));

var moduleUtils = rewire('../index.js');

moduleUtils.__set__("paths", {
	project: path.join(process.cwd(), 'test', 'mock-project'),
	config: path.join(process.cwd(), 'test', 'mock-project', '_config'),
	readme: path.join(process.cwd(), 'test', 'mock-project', 'readme.md'),
	cartridge: path.join(process.cwd(), 'test', 'mock-project', '_cartridge')
});

var moduleUtilsInstance = moduleUtils(mockPackageJson);
var mockConsoleLog = require('./mocks/mockConsoleLog');
var mockProcessExit = require('./mocks/mockProcessExit');

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
			mockConsoleLog.enable();
		})

		after(function() {
			mockConsoleLog.clearLogData();
		})

		it('should correctly log the input', function() {
			var logInput = "Who are the patriots?"
			var expected = fs.readFileSync(path.join(__dirname, 'structs', 'logMessage.txt'), 'utf8');
			var actual;

			moduleUtilsInstance.logMessage(logInput);
			mockConsoleLog.restore();

			actual = mockConsoleLog.getLogData();

			expect(expected).to.equal(actual);
		});

	})

	describe('When using the finishInstall function', function() {

		describe('And testing the on-screen output', function() {

			before(function() {
				mockConsoleLog.enable();
				mockProcessExit.enable();
			})

			after(function() {
				mockConsoleLog.clearLogData();
			})

			it('should correctly log the input', function() {
				var expected = fs.readFileSync(path.join(__dirname, 'structs', 'finishInstall.txt'), 'utf8');
				var actual;

				moduleUtilsInstance.finishInstall();
				mockConsoleLog.restore();
				mockProcessExit.restore();
				actual = mockConsoleLog.getLogData();

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
				mockConsoleLog.clearLogData();
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

	describe('When using the exitIfDevEnvironment', function() {

		describe('And NODE_ENV equals `development`', function() {

			beforeEach(function() {
				mockProcessExit.enable();
				mockConsoleLog.enable();

				process.env.NODE_ENV = 'development';
			})

			afterEach(function() {
				mockProcessExit.restore();
				mockConsoleLog.clearLogData();
			})

			it('should output on-screen message saying this step is going to be skipped', function() {
				var expected = fs.readFileSync(path.join(__dirname, 'structs', 'exitIfDevNodeEnvDevelopment.txt'), 'utf8');
				var actual;

				moduleUtilsInstance.exitIfDevEnvironment();
				mockConsoleLog.restore();

				actual = stripAnsi(mockConsoleLog.getLogData());

				expect(expected).to.equal(actual);
			})

			it('should exit the process with error code 0 (no error)', function() {
				var exitCallInfo;

				moduleUtilsInstance.exitIfDevEnvironment();
				mockConsoleLog.restore();

				exitCallInfo = mockProcessExit.callInfo();

				expect(exitCallInfo.called).to.be.true;
				expect(exitCallInfo.errorCode).to.equal(0);
			})

		})

		describe('And NODE_ENV does not equal `development`', function() {
			beforeEach(function() {
				mockProcessExit.enable();

				process.env.NODE_ENV = 'played-me-like-a-damn-fiddle';
			})

			afterEach(function() {
				mockProcessExit.restore();
			})

			it('should not output an on-screen message', function() {
				var expected = "";
				var actual;

				moduleUtilsInstance.exitIfDevEnvironment();
				mockConsoleLog.restore();

				actual = mockConsoleLog.getLogData();

				expect(expected).to.equal(actual);
			});

			it('should not exit the process', function() {
				var exitCallInfo;

				moduleUtilsInstance.exitIfDevEnvironment();
				exitCallInfo = mockProcessExit.callInfo();

				expect(exitCallInfo.called).to.be.false;
			})
		})
	})

	describe('When using addToRc', function() {

		var cartridgeRcStruct = JSON.parse(fs.readFileSync(path.join(__dirname, 'structs', 'cartridgeRc.json'), 'utf8'));
		var cartridgeRcJson;

		before(function() {
			fs.copySync(path.join(__dirname, 'stubs', 'cartridgeRcStub.json'), path.join(__dirname, 'mock-project', '.cartridgerc'));
			mockConsoleLog.enable();

			return moduleUtilsInstance.addToRc()
				.then(function() {
					mockConsoleLog.restore();
					mockConsoleLog.clearLogData();

					cartridgeRcJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock-project', '.cartridgerc'), 'utf8'));
				})
		})

		after(function() {
			fs.removeSync(path.join(__dirname, 'mock-project', '.cartridgerc'))
		})

		describe('And module data is written to the file', function() {

			it('should correctly populate the modules array', function() {
				expect(cartridgeRcJson.modules).to.be.an('array');
				expect(cartridgeRcJson.modules.length).to.equal(1);
			})

			it('should create a module object', function() {
				expect(cartridgeRcJson.modules[0]).to.be.an('object');
			});

			it('should correctly set the name value', function() {
				expect(cartridgeRcJson.modules[0].name).to.equal(cartridgeRcStruct.modules[0].name);
				expect(cartridgeRcJson.modules[0].name).to.be.a('string');
			})

			it('should correctly set the version value', function() {
				expect(cartridgeRcJson.modules[0].version).to.equal(cartridgeRcStruct.modules[0].version);
				expect(cartridgeRcJson.modules[0].version).to.be.a('string');
			})

			it('should correctly set the site value', function() {
				expect(cartridgeRcJson.modules[0].site).to.equal(cartridgeRcStruct.modules[0].site);
				expect(cartridgeRcJson.modules[0].site).to.be.a('string');
			})

			it('should correctly set the task value', function() {
				expect(cartridgeRcJson.modules[0].task).to.equal(cartridgeRcStruct.modules[0].task);
				expect(cartridgeRcJson.modules[0].task).to.be.a('string');
			})
		})

	})
})