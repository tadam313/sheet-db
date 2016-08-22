var sinon = require('sinon');
var chai = require('chai');

var apiV3 = require('../../lib/api/v3');
var testContext = require('nock')(apiV3.spec.root);
var testUtil = require('./../test_util');
var clientFactory = require('../../lib/rest_client');

var samplesSheetInfoResponse = require('../fixtures/v3/sample_sheet_info');

chai.use(require('sinon-chai'));

var expect = chai.expect;

describe('Rest client', function() {

    var client, converter, testSheetID = 'testSheetID', testWorkSheet = 'testWSheet';
    var fakeCache;

    var fakeCtx = {
        sheetId: testSheetID,
        worksheetId: testWorkSheet,
        visibility: 'public'
    };

    before(function() {
        var operations = apiV3.spec.operations;

        Object.keys(operations).forEach(function(operation) {
            var opCtx = apiV3.getOperationContext(operation, fakeCtx);
            var urlPath = opCtx.url.substr(apiV3.spec.root.length);
            var response = {};

            switch (operation) {
                case 'sheet_info':
                    response = samplesSheetInfoResponse;
                    break;
            }

            testContext = testContext
                .intercept(urlPath, operations[operation].method)
                .reply(200, response, {'Content-Type': 'application/json'});
        });
    });

    after(function() {
        testContext.done();
    });

    beforeEach(function() {
        fakeCache = {
            clear: sinon.spy(),
            get: sinon.spy(),
            put: sinon.spy()
        };

        client = clientFactory({token: null, gApi: apiV3, gCache: fakeCache});
        converter = apiV3.converter;
    });

    describe('#querySheetInfo', function() {

        it('should use sheetInfoResponse converter method', function*() {
            sinon.stub(converter, 'sheetInfoResponse');

            yield client.querySheetInfo(testSheetID);

            expect(converter.sheetInfoResponse).to.have.been.calledWith(samplesSheetInfoResponse);
        });
    });

    describe('#createWorksheet', function() {

        it('should use createWorksheetRequest converter method', function*() {
            sinon.stub(converter, 'createWorksheetRequest');
            sinon.stub(converter, 'workSheetInfoResponse');

            yield client.createWorksheet(testSheetID, testWorkSheet);

            expect(converter.createWorksheetRequest).to.have.been.called;
            expect(converter.workSheetInfoResponse).to.have.been.called;
            expect(fakeCache.clear).to.have.been.called;
        });
    });

    describe('#dropWorksheet', function() {

        it('should clear the cache', function*() {
            yield client.dropWorksheet(testSheetID, testWorkSheet);

            expect(fakeCache.clear).to.have.been.called;
        });
    });
});