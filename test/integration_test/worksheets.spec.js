'use strict';

var sheetFactory = require('./sheet_db_factory');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-subset'));

describe('Worksheets', function() {

    let sheetDb, worksheet, sheetName = 'test-sheet';

    let testData = [{
        a: 1,
        b: 'test'
    }, {
        c: 4,
        a: 10
    }, {
        d: 5.6,
        c: 'test2'
    }];

    before(function*() {
        sheetDb = yield sheetFactory();
        worksheet = yield sheetDb.createWorksheet(sheetName);
    });

    after(function*() {
        yield sheetDb.dropWorksheet(sheetName);
    });

    describe('#find', function() {

    });

    describe('#insert', function() {

        beforeEach(function*() {
            yield worksheet.remove();
        });

        it('should be able to insert objects', function*() {
            yield worksheet.insert(testData[0]);
            yield worksheet.insert(testData.slice(1));

            let result = yield worksheet.find();
            expect(result).all.to.containSubset(testData);
        });
    });

    describe('#remove', function() {

    });

    describe('#remove', function() {

    });
});