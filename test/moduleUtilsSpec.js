var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-fs'));
chai.should();

describe('As placehoder test', function() {

	it('should assert true is true', function() {
		true.should.be.true;
	})

})