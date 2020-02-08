'use strict';

var factory = require('./sheet_db_factory');
var Worksheet = require('../../src/worksheet');
let testUtil = require('../test_util');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-subset'));

describe('Spreadsheet API', function() {

    let sheetDb;
    let testSheet = 'test-sheet';

    before(async () => {
        sheetDb = await factory();
    });

    beforeEach(async () => {
        await testUtil.sleep();
    });

    afterEach(async () => {
        await sheetDb.dropWorksheet(testSheet);
    });

    describe('#createWorksheet', function() {

        it('should be able to create new worksheets', async () => {
            // arrange
            await sheetDb.createWorksheet(testSheet);

            // act
            let workSheet = await sheetDb.worksheet(testSheet);

            // assert
            expect(workSheet).to.be.an.instanceOf(Worksheet);
            expect(workSheet.worksheetInfo).to.containSubset({
                title: testSheet,
                sheetId: process.env.SHEET
            });
        });

        it('should be able to create a reference', async () => {
            // arrange
            let result = await sheetDb.worksheet(testSheet);
            expect(result).to.not.be.ok;

            // act
            await sheetDb.createWorksheet(testSheet);

            // assert
            result = await sheetDb.worksheet(testSheet);
            expect(result).to.be.ok;
        });
    });

    describe('#dropWorksheet', function() {
        beforeEach(async () => {
            await sheetDb.createWorksheet(testSheet);
        });

        it('should be able to remove worksheets from the list', async () => {
            // arrange
            let result = await sheetDb.worksheets();
            expect(result).to.have.length.above(0);

            // act
            await sheetDb.dropWorksheet(testSheet);

            // assert
            let newResult = await sheetDb.worksheets();
            expect(newResult).to.have.length.below(result.length);
        });

        it('should be able to erase the reference', async () => {
            // arrange
            let result = await sheetDb.worksheet(testSheet);
            expect(result).to.be.ok;

            // act
            await sheetDb.dropWorksheet(testSheet);

            // assert
            result = await sheetDb.worksheet(testSheet);
            expect(result).to.not.be.ok;
        });
    });
});
