
var query_response  = require('./fixtures/query_response');

var modelConverter  = require('../lib/model_converter'),
    assert          = require('assert');

describe('ModelConverter', function () {

    describe('#getItemIdFromUrl', function () {

        it('should return a last segment of the URI', function () {
            var sampleUrl = 'http://tempuri.org/test/this_is_an_id';

            var id = modelConverter.getItemIdFromUrl(sampleUrl);

            assert.equal(id, 'this_is_an_id');
        });
    });

    describe('#queryResponse', function () {

        it('should return appropriate data only', function () {
            var converted = modelConverter.queryResponse(query_response);

            assert.equal(converted.length, 1);
            assert.deepEqual(converted, [{
                $id: 'this_is_an_entryId',
                $updated: new Date('2015-03-31T23:19:20.960Z'),
                test1: 1,
                test2: 2
            }]);
        });
    });
});