'use strict';

require("babel-polyfill");

var Spreadsheet = require('../../lib/spreadsheet');
var Worksheet = require('../../lib/worksheet');
var api = require('../../lib/api').getApi('v3');
var chai = require('chai');
var sinon = require('sinon');
require('sinon-as-promised');

var sampleQueryResponse = api.converter.sheetInfoResponse(require('./../fixtures/v3/sample_sheet_info'));

chai.use(require('sinon-chai'));
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));

var expect = chai.expect;

describe('Spreadsheet', function() {

    var sheet;
    var sheetId = 'Sheet1';
    var restClient;
    var querySheetInfoStub;
    var createWorksheetStub;
    var dropWorksheetStub;

    beforeEach(function() {
        restClient = {
            createWorksheet: sinon.spy(),
            dropWorksheet: sinon.spy(),
            querySheetInfo: sinon.stub(),
            isAuthenticated: function() { return true; }
        };

        sheet = new Spreadsheet(sheetId, restClient, {token: 'test'});

        restClient.querySheetInfo.resolves(sampleQueryResponse);
    });

    describe('#sheetInfo', function() {

        it('should call api', function*() {
            // act
            yield sheet.info();

            // assert
            expect(restClient.querySheetInfo).to.have.been.calledWith(sheetId);
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

    });

    describe('#createWorksheet', function() {

        it('should create worksheet if it does not exist', function*() {
            // act
            let worksheetTitle = 'test';
            let worksheet = yield sheet.createWorksheet(worksheetTitle);

            // assert
            expect(restClient.createWorksheet).to.have.been.calledWith(sheetId, worksheetTitle);

            expect(worksheet).to.be.instanceof(Worksheet);
        });

        it('should not create a worksheet if "create_if_not_exists" flag is disabled', function*() {
            // act
            yield sheet.createWorksheet('Sheet1');

            // assert
            expect(restClient.createWorksheet).to.have.not.been.called;
        });

    });

    describe('#dropWorksheet', function() {

        it('should delete worksheet if it does exist', function*() {
            // act
            yield sheet.dropWorksheet('Sheet1');

            // assert
            expect(restClient.dropWorksheet).to.have.been.calledWith(sheetId, 'worksheetId_1');
        });

        it('should not delete worksheet if it does not exist', function*() {
            // act
            yield sheet.dropWorksheet('non-existent');

            // assert
            expect(restClient.dropWorksheet).to.have.not.been.called;
        });
    });


    describe('#worksheets', function() {

        it('should return worksheet instances', function*() {
           // act
            let workSheets = yield sheet.worksheets();

            // assert
            expect(workSheets).to.have.lengthOf(3);
            expect(workSheets).all.to.be.an.instanceOf(Worksheet);
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
