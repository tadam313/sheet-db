'use strict';

var Spreadsheet = require('../../src/spreadsheet');
var Worksheet = require('../../src/worksheet');
var api = require('../../src/api').getApi('v3');
var chai = require('chai');
var sinon = require('sinon');

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

        it('should call api', async () => {
            // act
            await sheet.info();

            // assert
            expect(restClient.querySheetInfo).to.have.been.calledWith(sheetId);
        });

        it('should provide expected result', async () => {
            // act
            let res = await sheet.info();

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

        it('should create worksheet if it does not exist', async () => {
            // act
            let worksheetTitle = 'test';
            let worksheet = await sheet.createWorksheet(worksheetTitle);

            // assert
            expect(restClient.createWorksheet).to.have.been.calledWith(sheetId, worksheetTitle);

            expect(worksheet).to.be.instanceof(Worksheet);
        });

        it('should not create a worksheet if "create_if_not_exists" flag is disabled', async () => {
            // act
            await sheet.createWorksheet('Sheet1');

            // assert
            expect(restClient.createWorksheet).to.have.not.been.called;
        });

    });

    describe('#dropWorksheet', function() {

        it('should delete worksheet if it does exist', async () => {
            // act
            await sheet.dropWorksheet('Sheet1');

            // assert
            expect(restClient.dropWorksheet).to.have.been.calledWith(sheetId, 'worksheetId_1');
        });

        it('should not delete worksheet if it does not exist', async () => {
            // act
            await sheet.dropWorksheet('non-existent');

            // assert
            expect(restClient.dropWorksheet).to.have.not.been.called;
        });
    });

    describe('#worksheets', function() {

        it('should return worksheet instances', async () => {
            // act
            let workSheets = await sheet.worksheets();

            // assert
            expect(workSheets).to.have.lengthOf(3);
            expect(workSheets).all.to.be.an.instanceOf(Worksheet);
        });
    });

    describe('#worksheet', function() {

        it('should return worksheet instance', async () => {
            // act
            let worksheet = await sheet.worksheet('Sheet1');

            // assert
            expect(worksheet).to.be.instanceof(Worksheet);
        });

        it('should return null if worksheet does not exist', async () => {
            // act
            let worksheet = await sheet.worksheet('not-exists');

            // assert
            expect(worksheet).to.not.exist;
        });

    });
});
