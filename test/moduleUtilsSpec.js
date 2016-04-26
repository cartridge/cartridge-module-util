var fs = require('fs-extra');
var path = require('path');

var chai = require('chai');
var stripAnsi = require('strip-ansi');
var rewire =  require('rewire')
var expect = chai.expect;

var testUtils = require('./testUtils');

testUtils.setTestDir(__dirname);

var testPaths = testUtils.getPaths();
var packageConfigJson = testUtils.readJsonFile(testPaths.structs, 'packageConfig.json');
var moduleUtils = rewire('../index.js');

moduleUtils.__set__("paths", {
	project: path.join(testPaths.mockProject),
	config: path.join(testPaths.mockProject, '_config'),
	readme: path.join(testPaths.mockProject, 'readme.md'),
	cartridge: path.join(testPaths.mockProject, '_cartridge')
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
			var expected = testUtils.readFile(testPaths.structs, 'logMessage.txt');
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
				var expected = testUtils.readFile(testPaths.structs, 'finishInstall.txt');
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
				var expected = testUtils.readFile(testPaths.structs, 'exitIfDevNodeEnvDevelopment.txt');
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

		var cartridgeRcStruct = testUtils.readJsonFile(testPaths.structs, 'cartridgeRcWithOneModule.json');
		var cartridgeRcJson;
		var copySource = path.join(testPaths.stubs, 'cartridgeRcStubNoModules.json');
		var copyDestination = path.join(testPaths.mockProject, '.cartridgerc')

		describe('And module data is written to the file', function() {

			before(function() {
				fs.copySync(copySource, copyDestination);
				mockConsoleLog.enable();

				return moduleUtilsInstance.addToRc()
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();

						cartridgeRcJson = testUtils.readJsonFile(testPaths.mockProject, '.cartridgerc');
					})
			})

			after(function() {
				fs.removeSync(path.join(testPaths.mockProject, '.cartridgerc'))
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

			var cartridgeRcStruct = testUtils.readJsonFile(testPaths.structs, 'cartridgeRcWithOneModule.json');
			var cartridgeRcJson;

			before(function() {
				fs.copySync(path.join(testPaths.stubs, 'cartridgeRcStubWithOneModule.json'), path.join(testPaths.mockProject, '.cartridgerc'));
				mockConsoleLog.enable();

				return moduleUtilsInstance.addToRc()
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();

						cartridgeRcJson = testUtils.readJsonFile(testPaths.mockProject, '.cartridgerc');
					})
			})

			after(function() {
				fs.removeSync(path.join(testPaths.mockProject, '.cartridgerc'))
			})

			it('should not create a duplicate entry in the modules array', function() {
				expect(cartridgeRcJson.modules).to.be.an('array');
				expect(cartridgeRcJson.modules.length).to.equal(1);
			})
		})

	})

	describe('When using removeFromRc', function() {

		after(function() {
			fs.removeSync(path.join(testPaths.mockProject, '.cartridgerc'))
		})

		describe('And the cartridgerc only has one module', function() {

			var cartridgeRcStruct = testUtils.readJsonFile(testPaths.structs, 'cartridgeRcWithNoModules.json');
			var cartridgeRcJson;

			before(function() {
				fs.copySync(path.join(testPaths.stubs, 'cartridgeRcStubWithOneModule.json'), path.join(testPaths.mockProject, '.cartridgerc'));
				mockConsoleLog.enable();

				return moduleUtilsInstance.removeFromRc()
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();

						cartridgeRcJson = testUtils.readJsonFile(testPaths.mockProject, '.cartridgerc');
					})
			})

			it('should correctly remove the module data', function() {
				expect(cartridgeRcJson.modules.length).to.equal(cartridgeRcStruct.modules.length);
			})

		})

		describe('And the cartridgerc has multiple modules', function() {

			var cartridgeRcStruct = testUtils.readJsonFile(testPaths.structs, 'cartridgeRcWithTwoModules.json');
			var cartridgeRcJson;

			before(function() {
				fs.copySync(path.join(testPaths.stubs, 'cartridgeRcStubWithThreeModules.json'), path.join(testPaths.mockProject, '.cartridgerc'));
				mockConsoleLog.enable();

				return moduleUtilsInstance.removeFromRc()
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();

						cartridgeRcJson = testUtils.readJsonFile(testPaths.mockProject, '.cartridgerc');
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
			fs.copySync(path.join(testPaths.stubs, 'projectJsonStub.json'), path.join(testPaths.mockProject, '_config', 'project.json'));
			mockConsoleLog.enable();

			return moduleUtilsInstance.modifyProjectConfig(transformFunction)
				.then(function() {
					mockConsoleLog.restore();
					mockConsoleLog.clearLogData();

					projectJson = testUtils.readJsonFile(path.join(testPaths.mockProject, '_config'), 'project.json');
			})
		})

		after(function() {
			fs.removeSync(path.join(testPaths.mockProject, '_config'))
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
				var expected = fs.readFileSync(path.join(testPaths.structs, 'ensureCartridgeExists.txt'), 'utf8');
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
				fs.copySync(path.join(testPaths.stubs, 'cartridgeRcStubWithOneModule.json'), path.join(testPaths.mockProject, '.cartridgerc'));

				mockProcessExit.enable();
				mockConsoleLog.enable();
			})

			afterEach(function() {
				fs.removeSync(path.join(testPaths.mockProject, '.cartridgerc'));

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

				return moduleUtilsInstance.copyFileToProject(path.join(testPaths.stubs, 'dummyCopyFile.txt'))
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();
					})
			})

			after(function() {
				fs.removeSync(path.join(testPaths.mockProject, 'dummyCopyFile.txt'));
			})

			it('should copy the file to the project root', function() {
				expect(path.join(testPaths.mockProject, 'dummyCopyFile.txt')).to.be.a.file();
			})

		})

		describe('And a destination path is provided', function() {

			before(function() {
				mockConsoleLog.enable();

				return moduleUtilsInstance.copyFileToProject(path.join(testPaths.stubs, 'dummyCopyFile.txt'), 'destination-folder')
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();
					})
			})

			after(function() {
				fs.removeSync(path.join(testPaths.mockProject, 'destination-folder'));
			})

			it('should copy the file to the specificed path', function() {
				expect(path.join(testPaths.mockProject, 'destination-folder', 'dummyCopyFile.txt')).to.be.a.file();
			})
		})

		describe('And a file that already exists is being copied', function() {

			before(function() {
				mockConsoleLog.enable();

				fs.copySync(path.join(testPaths.stubs, 'dummyCopyFileAlt.txt'), path.join(testPaths.mockProject, 'dummyCopyFile.txt'));

				return moduleUtilsInstance.copyFileToProject(path.join(testPaths.stubs, 'dummyCopyFile.txt'))
					.then(function() {
						mockConsoleLog.restore();
					})
			})

			after(function() {
				mockConsoleLog.clearLogData();
				fs.removeSync(path.join(testPaths.mockProject, 'dummyCopyFile.txt'));
			})

			it('should not copy the file', function() {
				expect(path.join(testPaths.mockProject, 'dummyCopyFile.txt')).to.not.have.content("This is a dummy file");
			})

			it('should correct output the on-screen message saying this step has been skipped', function() {
				var expected = fs.readFileSync(path.join(testPaths.structs, 'copyFileToProjectSkippingMessage.txt'), 'utf8')
				var actual = mockConsoleLog.getLogData()

				expect(actual).to.be.equal(expected)
			})

		})

	})

	describe('When using copyToProjectDir', function() {

		describe('And copying over multiple file with no destination provided', function() {

			before(function() {
				mockConsoleLog.enable();

				return moduleUtilsInstance.copyToProjectDir([{
						copyPath: path.join(testPaths.structs, 'cartridgeRcWithNoModules.json')
					}, {
						copyPath: path.join(testPaths.structs, 'cartridgeRcWithOneModule.json')
					}, {
						copyPath: path.join(testPaths.structs, 'cartridgeRcWithTwoModules.json')
					}])
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();
					})
			})

			after(function() {
				fs.removeSync(path.join(testPaths.mockProject, 'cartridgeRcWithNoModules.json'));
				fs.removeSync(path.join(testPaths.mockProject, 'cartridgeRcWithOneModule.json'));
				fs.removeSync(path.join(testPaths.mockProject, 'cartridgeRcWithTwoModules.json'));

				mockConsoleLog.clearLogData();
			})

			it('should correctly copy over the files to the project root', function() {
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithNoModules.json')).to.be.a.path();
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithOneModule.json')).to.be.a.path();
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithTwoModules.json')).to.be.a.path();
			})

		})

		describe('And copying over multiple files with destination paths provided', function() {

			before(function() {
				mockConsoleLog.enable();

				return moduleUtilsInstance.copyToProjectDir([{
						copyPath: path.join(testPaths.structs, 'cartridgeRcWithNoModules.json'),
						destinationPath: '_config'
					}, {
						copyPath: path.join(testPaths.structs, 'cartridgeRcWithOneModule.json'),
						destinationPath: 'folder'
					}, {
						copyPath: path.join(testPaths.structs, 'cartridgeRcWithTwoModules.json'),
						destinationPath: 'folder2'
					}])
					.then(function() {
						mockConsoleLog.restore();
						mockConsoleLog.clearLogData();
					})
			})

			after(function() {
				fs.removeSync(path.join(testPaths.mockProject, '_config'));
				fs.removeSync(path.join(testPaths.mockProject, 'folder'));
				fs.removeSync(path.join(testPaths.mockProject, 'folder2'));
			})

			it('should correctly copy over the files to the provided paths', function() {
				expect(path.join(testPaths.mockProject, '_config', 'cartridgeRcWithNoModules.json')).to.be.a.path();
				expect(path.join(testPaths.mockProject, 'folder', 'cartridgeRcWithOneModule.json')).to.be.a.path();
				expect(path.join(testPaths.mockProject, 'folder2', 'cartridgeRcWithTwoModules.json')).to.be.a.path();
			})
		})
	})

	describe('When using removeFromProjectDir', function() {

		describe('And deleting one file', function() {

			before(function() {
				mockConsoleLog.enable();

				fs.copySync(path.join(testPaths.structs, 'cartridgeRcWithNoModules.json'), path.join(testPaths.mockProject, 'cartridgeRcWithNoModules.json'));

				return moduleUtilsInstance.removeFromProjectDir(['cartridgeRcWithNoModules.json'])
					.then(function() {
						mockConsoleLog.restore();
					})
			})

			after(function() {
				mockConsoleLog.clearLogData();
			})

			it('should correctly delete remove the file', function() {
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithNoModules.json')).to.not.be.a.path();
			})

			it('should correctly output a on-screen message', function() {
				var expected = fs.readFileSync(path.join(testPaths.structs, 'removeFromProjectDirSingleFile.txt'), 'utf8')
				var actual = mockConsoleLog.getLogData();

				expect(actual).to.be.equal(expected);
			})

		})

		describe('And deleting multiple files', function() {
			before(function() {
				mockConsoleLog.enable();

				fs.copySync(path.join(testPaths.structs, 'cartridgeRcWithNoModules.json'), path.join(testPaths.mockProject, 'cartridgeRcWithNoModules.json'));
				fs.copySync(path.join(testPaths.structs, 'cartridgeRcWithOneModule.json'), path.join(testPaths.mockProject, 'cartridgeRcWithOneModule.json'));
				fs.copySync(path.join(testPaths.structs, 'cartridgeRcWithTwoModules.json'), path.join(testPaths.mockProject, 'cartridgeRcWithTwoModules.json'));

				return moduleUtilsInstance.removeFromProjectDir([
						'cartridgeRcWithNoModules.json',
						'cartridgeRcWithOneModule.json',
						'cartridgeRcWithTwoModules.json'
					])
					.then(function() {
						mockConsoleLog.restore();
					})
			})

			after(function() {
				mockConsoleLog.clearLogData();
			})

			it('should correctly delete all of the files', function() {
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithNoModules.json')).to.not.be.a.path();
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithOneModule.json')).to.not.be.a.path();
				expect(path.join(testPaths.mockProject, 'cartridgeRcWithTwoModules.json')).to.not.be.a.path();
			})

			//@TODO ensuring the specific order of the log message is not 100%
			//due to async nature
			//Asert the number of lines in the text instead?
			it.skip('should correctly output an on-screen message', function() {
				var expected = fs.readFileSync(path.join(testPaths.structs, 'removeFromProjectDirMultipleFiles.txt'), 'utf8')
				var actual = mockConsoleLog.getLogData();

				expect(actual).to.be.equal(expected);
			})

		})

	})

	describe('When using addModuleConfig', function() {

		before(function() {
			mockConsoleLog.enable();

			return moduleUtilsInstance.addModuleConfig(path.join(testPaths.structs, 'moduleConfig.js'))
				.then(function() {
					mockConsoleLog.restore();
				})
		})

		after(function() {
			fs.removeSync(path.join(testPaths.mockProject, '_config'));
			mockConsoleLog.clearLogData();
		})

		it('should correctly copy over the module config', function() {
			expect(path.join(testPaths.mockProject, '_config', 'moduleConfig.js')).to.be.a.file();
		})

		it('should correctly output an on-screen message', function() {
			var expected = fs.readFileSync(path.join(testPaths.structs, 'addModuleConfigLog.txt'), 'utf8')
			var actual = mockConsoleLog.getLogData();

			expect(actual).to.be.equal(expected);
		})
	})

	describe('When using removeModuleConfig', function() {
		before(function() {
			mockConsoleLog.enable();

			fs.copySync(path.join(testPaths.structs, 'moduleConfig.js'), path.join(testPaths.mockProject, '_config', 'moduleConfig.js'));

			return moduleUtilsInstance.removeModuleConfig(path.join(testPaths.structs, 'moduleConfig.js'))
				.then(function() {
					mockConsoleLog.restore();
				})
		})

		after(function() {
			fs.removeSync(path.join(testPaths.mockProject, '_config'));
			mockConsoleLog.clearLogData();
		})

		it('should correctly remove the module config', function() {
			expect(path.join(testPaths.mockProject, '_config', 'moduleConfig.js')).to.not.be.a.path()
		})

		it('should correctly output an on-screen message', function() {
			var expected = fs.readFileSync(path.join(testPaths.structs, 'removeModuleConfig.txt'), 'utf8')
			var actual = mockConsoleLog.getLogData();

			expect(actual).to.be.equal(expected);
		})
	})
})