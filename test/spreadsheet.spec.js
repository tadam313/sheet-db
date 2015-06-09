'use strict';

var Spreadsheet = require('../lib/spreadsheet');
var Worksheet = require('../lib/worksheet');
var clientFactory = require('../lib/rest_client');
var testUtil = require('./test_util');
var chai = require('chai');
var sinon = require('sinon');

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
        querySheetInfoStub.yields(null, restClient.getApi().converter.sheetInfoResponse(sampleQueryResponse));

        createWorksheetStub = sinon.stub(restClient, 'createWorksheet');
        createWorksheetStub.yields(null);

        dropWorksheetStub = sinon.stub(restClient, 'dropWorksheet');
        dropWorksheetStub.yields(null);

        spy = sinon.spy();
    });

    afterEach(function() {
        querySheetInfoStub.restore();
        createWorksheetStub.restore();
        dropWorksheetStub.restore();
    });

    describe('#sheetInfo', function() {

        it('should call api', function() {
            // act
            sheet.info(spy);

            // assert
            expect(querySheetInfoStub).to.have.been.calledWith(
                sheetTitle
            );

            expect(spy).to.have.been.calledWith(null,
                sinon.match({title: 'Test'})
            );
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(querySheetInfoStub, function(spy) {
                sheet.info(spy);
            });
        });
    });

    describe('#createWorksheet', function() {

        it('should call api', function() {
            // act
            sheet.createWorksheet('test', spy);

            // assert
            expect(createWorksheetStub).to.have.been.calledWith(
                sheetTitle
            );
        });

        it('should return worksheet instance', function() {
            // arrange
            var worksheetStub = sinon.stub(sheet, 'worksheet');
            worksheetStub.yields(null, new Worksheet('test', {}, restClient));

            // act
            sheet.createWorksheet('test', spy);

            // assert
            expect(spy).to.have.been.calledWith(null,
                sinon.match.instanceOf(Worksheet)
            );
        });

        it('should check worksheet existance if worksheets are cached (via sheetInfo)', function() {
            // act
            sheet.info(spy);
            sheet.createWorksheet('Sheet1', spy);

            // assert
            expect(createWorksheetStub).to.not.have.been.called;
            expect(spy).to.have.been.calledWith(null,
                sinon.match.instanceOf(Worksheet)
            );
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(createWorksheetStub, function(spy) {
                sheet.createWorksheet(null, spy);
            });
        });
    });

    describe('#dropWorksheet', function() {

        it('should call api', function() {
            // act
            sheet.dropWorksheet('Sheet1', spy);

            // assert
            expect(dropWorksheetStub).to.have.been.calledWith(
                sheetTitle, 'worksheetId_1'
            );
        });

        it('should raise error if sheet does not exist', function() {
            // act
            sheet.dropWorksheet('test', spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(
                new Error()
            );
        });

        it('should reports error', function() {
            testUtil.assertFuncReportsError(dropWorksheetStub, function(spy) {
                sheet.dropWorksheet(null, spy);
            });
        });
    });

    describe('#worksheet', function() {

        it('should return value via callback', function() {
            // act
            sheet.worksheet('Sheet1', spy);

            // assert
            expect(spy).to.have.been.calledWith(null,
                sinon.match.instanceOf(Worksheet)
            );
        });

        it('should return value normally and callback if sheetInfo is called', function() {
            // act
            sheet.info(spy);
            var worksheet = sheet.worksheet('Sheet1', spy);

            // assert
            expect(worksheet).to.be.an.instanceOf(Worksheet);
            expect(spy).to.have.been.calledWith(null,
                sinon.match.same(worksheet)
            );
        });

        it('should raise error if callback is not set and sheetInfo is not called', function() {
            // arrange
            var worksheetFunc = sheet.worksheet.bind(sheet, 'Sheet1');

            // assert
            expect(worksheetFunc).to.throw(Error);
        });

        it('should raise error if sheet does not exist', function() {
            // act
            sheet.worksheet('test', spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(
                sinon.match(Error)
            );
        });
    });
});
