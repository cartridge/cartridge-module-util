var fs = require('fs');
var path = require('path');

var chai = require('chai');
var expect = chai.expect;
var mockPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, './mockPackageConfig.json'), 'utf8'));
var moduleUtils = require('../index.js');
var moduleUtilsInstance = moduleUtils(mockPackageJson);

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

})