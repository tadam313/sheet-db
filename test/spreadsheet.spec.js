'use strict';

require("babel-polyfill");

var Spreadsheet = require('../lib/spreadsheet');
var Worksheet = require('../lib/worksheet');
var clientFactory = require('../lib/rest_client');
var testUtil = require('./test_util');
var chai = require('chai');
var sinon = require('sinon');
require('sinon-as-promised');

var sampleQueryResponse = require('./fixtures/v3/sample_sheet_info');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Spreadsheet', function() {

    var sheet;
    var sheetTitle = 'Sheet1';
    var restClient;
    var querySheetInfoStub;
    var createWorksheetStub;
    var dropWorksheetStub;
    var spy;

    beforeEach(function() {
        restClient = clientFactory('test');
        sheet = new Spreadsheet(sheetTitle, restClient, {token: 'test'});

        querySheetInfoStub = sinon.stub(restClient, 'querySheetInfo');
        querySheetInfoStub.resolves(restClient.getApi().converter.sheetInfoResponse(sampleQueryResponse));

        createWorksheetStub = sinon.stub(restClient, 'createWorksheet');
        dropWorksheetStub = sinon.stub(restClient, 'dropWorksheet');

        spy = sinon.spy();
    });

    afterEach(function() {
        querySheetInfoStub.restore();
        createWorksheetStub.restore();
        dropWorksheetStub.restore();
    });

    describe('#sheetInfo', function() {

        it('should call api', function*() {
            // act
            let res = yield sheet.info();

            // assert
            expect(querySheetInfoStub).to.have.been.calledWith(sheetTitle);
            expect(res).to.match({title: 'Test'})
        });
    });

    describe('#createWorksheet', function() {

        it('should call api', function*() {
            // act
            yield sheet.createWorksheet('test', spy);

            // assert
            expect(createWorksheetStub).to.have.been.calledWith(
                sheetTitle
            );
        });

        it('should return worksheet instance', function*() {
            // arrange
            var worksheetStub = sinon.stub(sheet, 'worksheet');
            worksheetStub.resolves(new Worksheet('test', {}, restClient));

            // act
            let res = yield sheet.createWorksheet('test', spy);

            // assert
            expect(res).to.match(sinon.match.instanceOf(Worksheet));
        });
    });

    describe('#dropWorksheet', function() {

        it('should call api', function*() {
            // act
            yield sheet.dropWorksheet('Sheet1');

            // assert
            expect(dropWorksheetStub).to.have.been.calledWith(
                sheetTitle, 'worksheetId_1'
            );
        });

        // TODO: should raise error if sheet does not exist
    });

    describe('#worksheet', function() {

        // TODO: should return worksheet

        it('should raise error if sheet does not exist', function() {
            // act
            let underTest = sheet.worksheet.bind('test', spy);

            // assert
            expect(underTest).to.throw(Error);
        });
    });
});
