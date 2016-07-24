'use strict';

var factory = require('./sheet_db_factory');
var Worksheet = require('../../lib/worksheet');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-subset'));

describe('Spreadsheet API', function() {

    let sheetDb, testSheet = 'test-sheet';

    before(function*() {
        sheetDb = yield factory();
    });

    afterEach(function*() {
        yield sheetDb.dropWorksheet(testSheet);
    });

    describe('#createWorksheet', function() {

        it('should be able to create new worksheets', function*() {
            // arrange
            yield sheetDb.createWorksheet(testSheet);

            // act
            let workSheet = yield sheetDb.worksheet(testSheet);

            // assert
            expect(workSheet).to.be.an.instanceOf(Worksheet);
            expect(workSheet.worksheetInfo).to.containSubset({
                title: testSheet,
                sheetId: process.env.SHEET
            });
        });

        it('should be able to create a reference', function*() {
            // arrange
            let result = yield sheetDb.worksheet(testSheet);
            expect(result).to.not.be.ok;

            // act
            yield sheetDb.createWorksheet(testSheet);

            // assert
            result = yield sheetDb.worksheet(testSheet);
            expect(result).to.be.ok;
        });
    });

    describe('#dropWorksheet', function() {
        beforeEach(function*() {
            yield sheetDb.createWorksheet(testSheet);
        });

        it('should be able to remove worksheets from the list', function*() {
            // arrange
            let result = yield sheetDb.worksheets();
            expect(result).to.have.length.above(0);

            // act
            yield sheetDb.dropWorksheet(testSheet);

            // assert
            let newResult = yield sheetDb.worksheets();
            expect(newResult).to.have.length.below(result.length);
        });

        it('should be able to erase the reference', function*() {
            // arrange
            let result = yield sheetDb.worksheet(testSheet);
            expect(result).to.be.ok;

            // act
            yield sheetDb.dropWorksheet(testSheet);

            // assert
            result = yield sheetDb.worksheet(testSheet);
            expect(result).to.not.be.ok;
        });
    });
});