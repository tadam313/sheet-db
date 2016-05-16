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
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));

var expect = chai.expect;

describe('Spreadsheet', function() {

    var sheet;
    var sheetTitle = 'Sheet1';
    var restClient;
    var querySheetInfoStub;
    var createWorksheetStub;
    var dropWorksheetStub;

    beforeEach(function() {
        restClient = clientFactory('test');
        sheet = new Spreadsheet(sheetTitle, restClient, {token: 'test'});

        querySheetInfoStub = sinon.stub(restClient, 'querySheetInfo');
        querySheetInfoStub.resolves(
            restClient.getApi().converter.sheetInfoResponse(sampleQueryResponse)
        );

        createWorksheetStub = sinon.stub(restClient, 'createWorksheet');
        dropWorksheetStub = sinon.stub(restClient, 'dropWorksheet');
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
        });

        it('should provide expected result', function*() {
            // act
            let res = yield sheet.info();

            // assert
            expect(res).to.containSubset({
                title: 'Test',
                updated: new Date('2015-04-02T21:25:42.467Z'),
                authors: [{
                    email: 'author_name@tempuri.org',
                    name: 'author_name'
                }]
            });
        });

        it('should return worksheet instances', function*() {
           // act
            let info = yield sheet.info();

            // assert
            expect(info.workSheets).to.have.lengthOf(3);
            expect(info.workSheets).all.to.be.an.instanceOf(Worksheet);
        });
    });

    describe('#createWorksheet', function() {

        it('should create worksheet if it does not exist', function*() {
            // act
            let worksheet = yield sheet.createWorksheet('non-existent');

            // assert
            expect(createWorksheetStub).to.have.been.calledWith(sheetTitle);
            expect(worksheet).to.be.instanceof(Worksheet);
        });

        it('should not create a worksheet if "create_if_not_exists" flag is disabled', function*() {
            // act
            let worksheet = yield sheet.createWorksheet('Sheet1');

            // assert
            expect(createWorksheetStub).to.have.not.been.called;
        });

    });

    describe('#dropWorksheet', function() {

        it('should delete worksheet if it does exist', function*() {
            // act
            yield sheet.dropWorksheet('Sheet1');

            // assert
            expect(dropWorksheetStub).to.have.been.calledWith(sheetTitle, 'worksheetId_1');
        });

        it('should not delete worksheet if it does not exist', function*() {
            // act
            yield sheet.dropWorksheet('non-existent');

            // assert
            expect(dropWorksheetStub).to.have.not.been.called;
        });
    });


    describe('#worksheet', function() {

        it('should return worksheet instance', function*() {
            // act
            let worksheet = yield sheet.worksheet('Sheet1');

            // assert
            expect(worksheet).to.be.instanceof(Worksheet);
        });

        it('should return null if worksheet does not exist', function*() {
            // act
            let worksheet = yield sheet.worksheet('not-exists');

            // assert
            expect(worksheet).to.not.exist;
        });

    });
});
