var fs = require('fs-extra');
var path = require('path');

var chai = require('chai');
var stripAnsi = require('strip-ansi');
var rewire =  require('rewire')
var expect = chai.expect;
var packageConfigJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'structs', 'packageConfig.json'), 'utf8'));

var moduleUtils = rewire('../index.js');

moduleUtils.__set__("paths", {
	project: path.join(process.cwd(), 'test', 'mock-project'),
	config: path.join(process.cwd(), 'test', 'mock-project', '_config'),
	readme: path.join(process.cwd(), 'test', 'mock-project', 'readme.md'),
	cartridge: path.join(process.cwd(), 'test', 'mock-project', '_cartridge')
});

var moduleUtilsInstance = moduleUtils(packageConfigJson);
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

			expect(actual).to.equal(expected);
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

				expect(actual).to.equal(expected);
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

				expect(actual).to.equal(expected);
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

				expect(actual).to.equal(expected);
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

		var cartridgeRcStruct = JSON.parse(fs.readFileSync(path.join(__dirname, 'structs', 'cartridgeRcWithOneModule.json'), 'utf8'));
		var cartridgeRcJson;

		describe('And module data is written to the file', function() {

			before(function() {
				fs.copySync(path.join(__dirname, 'stubs', 'cartridgeRcStubNoModules.json'), path.join(__dirname, 'mock-project', '.cartridgerc'));
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

		describe('And the module data already exists in the cartridgerc file', function() {

			var cartridgeRcStruct = JSON.parse(fs.readFileSync(path.join(__dirname, 'structs', 'cartridgeRcWithOneModule.json'), 'utf8'));
			var cartridgeRcJson;

			before(function() {
				fs.copySync(path.join(__dirname, 'stubs', 'cartridgeRcStubWithOneModule.json'), path.join(__dirname, 'mock-project', '.cartridgerc'));
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

			it('should not create a duplicate entry in the modules array', function() {
				expect(cartridgeRcJson.modules).to.be.an('array');
				expect(cartridgeRcJson.modules.length).to.equal(1);
			})
		})

	})

	describe('When using removeFromRc', function() {

		after(function() {
			fs.removeSync(path.join(__dirname, 'mock-project', '.cartridgerc'))
		})

		describe('And the cartridgerc only has one module', function() {

			var cartridgeRcStruct = JSON.parse(fs.readFileSync(path.join(__dirname, 'structs', 'cartridgeRcWithNoModules.json'), 'utf8'));
			var cartridgeRcJson;

			before(function() {
				fs.copySync(path.join(__dirname, 'stubs', 'cartridgeRcStubWithOneModule.json'), path.join(__dirname, 'mock-project', '.cartridgerc'));
				mockConsoleLog.enable();

				return moduleUtilsInstance.removeFromRc()
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();

						cartridgeRcJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock-project', '.cartridgerc'), 'utf8'));
					})
			})

			it('should correctly remove the module data', function() {
				expect(cartridgeRcJson.modules.length).to.equal(cartridgeRcStruct.modules.length);
			})

		})

		describe('And the cartridgerc has multiple modules', function() {

			var cartridgeRcStruct = JSON.parse(fs.readFileSync(path.join(__dirname, 'structs', 'cartridgeRcWithTwoModules.json'), 'utf8'));
			var cartridgeRcJson;

			before(function() {
				fs.copySync(path.join(__dirname, 'stubs', 'cartridgeRcStubWithThreeModules.json'), path.join(__dirname, 'mock-project', '.cartridgerc'));
				mockConsoleLog.enable();

				return moduleUtilsInstance.removeFromRc()
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();

						cartridgeRcJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock-project', '.cartridgerc'), 'utf8'));
					})
			})

			it('should correctly remove the module data', function() {
				expect(cartridgeRcJson.modules.length).to.equal(cartridgeRcStruct.modules.length);

				for (var i = 0; i < cartridgeRcJson.modules.length; i++) {
					expect(cartridgeRcJson.modules[i].name).to.not.equal(packageConfigJson.name);
				}
			})

		})

	})

	describe('When using modifyProjectConfig', function() {
		var projectJson;
		var transformFunction = function(config) {
			config.paths.metal = "gear?!";

			return config;
		}

		before(function() {
			fs.copySync(path.join(__dirname, 'stubs', 'projectJsonStub.json'), path.join(__dirname, 'mock-project', '_config', 'project.json'));
			mockConsoleLog.enable();

			return moduleUtilsInstance.modifyProjectConfig(transformFunction)
				.then(function() {
					mockConsoleLog.restore();
					mockConsoleLog.clearLogData();

					projectJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock-project', '_config', 'project.json'), 'utf8'));
			})
		})

		after(function() {
			fs.removeSync(path.join(__dirname, 'mock-project', '_config'))
		})

		it('should correctly add the data to the project.json file', function() {
			var expected = "gear?!";

			expect(projectJson.paths.metal).to.not.be.undefined;
			expect(projectJson.paths.metal).to.equal(expected);
		});

	})

	describe('When using ensureCartridgeExists', function() {

		describe('And the cartridgerc file does not exist', function() {

			beforeEach(function() {
				mockProcessExit.enable();
				mockConsoleLog.enable();
			})

			afterEach(function() {
				mockConsoleLog.clearLogData();
				mockProcessExit.restore();
			})

			it('should output an on-screen message', function() {
				var expected = fs.readFileSync(path.join(__dirname, 'structs', 'ensureCartridgeExists.txt'), 'utf8');
				var actual;

				moduleUtilsInstance.ensureCartridgeExists();
				mockConsoleLog.restore();

				actual = stripAnsi(mockConsoleLog.getLogData());

				expect(actual).to.equal(expected);
			})

			it('should exit the process with error code 1 (error)', function() {
				var exitCallInfo;

				moduleUtilsInstance.ensureCartridgeExists();
				mockConsoleLog.restore();

				exitCallInfo = mockProcessExit.callInfo();

				expect(exitCallInfo.called).to.be.true;
				expect(exitCallInfo.errorCode).to.equal(1);
			})

		})

		describe('And the cartridge file does exist', function() {
			beforeEach(function() {
				fs.copySync(path.join(__dirname, 'stubs', 'cartridgeRcStubWithOneModule.json'), path.join(__dirname, 'mock-project', '.cartridgerc'));

				mockProcessExit.enable();
				mockConsoleLog.enable();
			})

			afterEach(function() {
				fs.removeSync(path.join(__dirname, 'mock-project', '.cartridgerc'));

				mockConsoleLog.clearLogData();
				mockProcessExit.restore();
			})

			it('should not output an on-screen message', function() {
				var expected = "";
				var actual;

				moduleUtilsInstance.ensureCartridgeExists();
				mockConsoleLog.restore();

				actual = mockConsoleLog.getLogData();

				expect(actual).to.equal(expected);
			})

			it('should not exit the process', function() {
				var exitCallInfo;

				moduleUtilsInstance.ensureCartridgeExists();
				mockConsoleLog.restore();

				exitCallInfo = mockProcessExit.callInfo();

				expect(exitCallInfo.called).to.be.false;
			})
		})

	})

	describe('When using copyFileToProject', function() {

		describe('And no destination path is provided', function() {

			before(function() {
				mockConsoleLog.enable();

				return moduleUtilsInstance.copyFileToProject(path.join(__dirname, 'stubs', 'dummyCopyFile.txt'))
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();
					})
			})

			after(function() {
				fs.removeSync(path.join(__dirname, 'mock-project', 'dummyCopyFile.txt'));
			})

			it('should copy the file to the project root', function() {
				expect(path.join(__dirname, 'mock-project', 'dummyCopyFile.txt')).to.be.a.file();
			})

		})

		describe('And a destination path is provided', function() {

			before(function() {
				mockConsoleLog.enable();

				return moduleUtilsInstance.copyFileToProject(path.join(__dirname, 'stubs', 'dummyCopyFile.txt'), 'destination-folder')
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();
					})
			})

			after(function() {
				fs.removeSync(path.join(__dirname, 'mock-project', 'destination-folder'));
			})

			it('should copy the file to the specificed path', function() {
				expect(path.join(__dirname, 'mock-project', 'destination-folder', 'dummyCopyFile.txt')).to.be.a.file();
			})
		})

		describe('And a file that already exists is being copied', function() {

			before(function() {
				mockConsoleLog.enable();

				fs.copySync(path.join(__dirname, 'stubs', 'dummyCopyFileAlt.txt'), path.join(__dirname, 'mock-project', 'dummyCopyFile.txt'));

				return moduleUtilsInstance.copyFileToProject(path.join(__dirname, 'stubs', 'dummyCopyFile.txt'))
					.then(function() {
						mockConsoleLog.restore();
					})
			})

			after(function() {
				mockConsoleLog.clearLogData();
				fs.removeSync(path.join(__dirname, 'mock-project', 'dummyCopyFile.txt'));
			})

			it('should not copy the file', function() {
				expect(path.join(__dirname, 'mock-project', 'dummyCopyFile.txt')).to.not.have.content("This is a dummy file");
			})

			it('should output on-screen message saying this step has been skipped', function() {
				var expected = fs.readFileSync(path.join(__dirname, 'structs', 'copyFileToProjectSkippingMessage.txt'), 'utf8')
				var actual = mockConsoleLog.getLogData()

				expect(actual).to.be.equal(expected)
			})

		})

	})
})