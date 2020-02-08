'use strict';

var api  = require('../../../src/api');
var expect = require('chai').expect;

describe('Api_selector', function() {

    describe('#getSupportedVersions', function() {
        it('returns a list', function() {
            expect(api.getSupportedVersions()).to.be.instanceOf(Array);
        });
    });

    describe('#getApi', function() {
        it('returns an API instance', function() {
            expect(api.getApi('v3')).to.include.keys('getOperationContext', 'converter');
        });

        it('throws error if no such API exist', function() {
            expect(api.getApi.bind(null, ['not_exists'])).to.throw(Error);
        });
    });
});
