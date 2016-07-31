'use strict';

let sheetFactory = require('./sheet_db_factory');
let testUtil = require('../test_util');
let chai = require('chai');
let expect = chai.expect;

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

    let testSelector = {
        $or: [{
            $and: [{
                d: {$gt: 5}
            }, {
                c: 'test2'
            }]
        }, {
            b: 'test'
        }, {
            a: {$lt: 5}
        }]
    };

    before(function*() {
        sheetDb = yield sheetFactory();
        worksheet = yield sheetDb.createWorksheet(sheetName);
    });

    after(function*() {
        if (sheetDb) {
            yield sheetDb.dropWorksheet(sheetName);
        }
    });

    beforeEach(function* () {
        yield worksheet.remove();
        yield testUtil.sleep();
    });

    describe('#find', function() {
        beforeEach(function*() {
            yield worksheet.insert(testData, {ordered: true});
        });

        it('should be able to list the whole sheet', function*() {
            let result = yield worksheet.find();

            expect(result).to.containSubset(testData);
        });

        it('should be able to filter dataset', function*() {
            let result = yield worksheet.find(testSelector);

            expect(result).to.containSubset([testData[2], testData[0]]);
        });

        it('should be able to limit and skip results', function*() {
            let result = yield worksheet.find(null, {
                skip: 1,
                limit: 1
            });

            expect(result).to.containSubset([testData[1]]);
        });
    });

    describe('#insert', function() {
        it('should be able to insert objects', function*() {
            yield worksheet.insert(testData[0]);
            yield worksheet.insert(testData.slice(1));

            let result = yield worksheet.find();
            expect(result).all.to.containSubset(testData);
        });
    });

    describe('#remove', function() {

        beforeEach(function*() {
            yield worksheet.insert(testData, {ordered: true});
        });

        it('should be able to delete whole worksheet', function*() {
            yield worksheet.remove();

            let result = yield worksheet.find();
            expect(result).to.eql([]);
        });

        it('should be able to remove selected data', function*() {
            yield worksheet.remove(testSelector);

            let result = yield worksheet.find();
            expect(result).to.containSubset([testData[1]]);
        });

        it('should be able to remove just one row', function*() {
            yield worksheet.remove(null, {justOne: true});

            let result = yield worksheet.find();
            expect(result).to.containSubset([testData[1], testData[2]]);
        });
    });

    describe('#update', function() {
        beforeEach(function*() {
            yield worksheet.insert(testData);
        });

        it('should be able to update selected data', function* () {
            let descriptor = {
                $set: {c: 'test3'},
                $inc: {d: 1, a: -2}
            };

            yield worksheet.update(testSelector, descriptor, {multiple: true});

            let result = yield worksheet.find();
            expect(result).to.containSubset([
                {a: -1, b: 'test'},
                {c: 'test3', d: 6.6}
            ]);
        });

        it('should be able to replace object', function* () {
            let descriptor = {
                b: 'test5',
            };

            yield worksheet.update({b: 'test'}, descriptor);

            let result = yield worksheet.find();
            expect(result).to.containSubset([{a: 1, b: 'test5'}]);
        });

        it('should not touch data set if nothing is selected', function* () {
            let selector = {
                a: {$gt: 169}
            };

            let descriptor = {
                $inc: {a: 4}
            };

            yield worksheet.update(selector, descriptor);

            let result = yield worksheet.find();
            expect(result).to.containSubset(testData);
        });

        it('should not touch data set if update descriptor updates nothing', function* () {
            let descriptor = {
                $set: {notExists: 'nope'}
            };

            yield worksheet.update(testSelector, descriptor, {multiple: true});

            let result = yield worksheet.find();
            expect(result).to.containSubset(testData);
        });
    });
});