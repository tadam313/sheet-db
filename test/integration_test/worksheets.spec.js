'use strict';

let sheetFactory = require('./sheet_db_factory');
let testUtil = require('../test_util');
let chai = require('chai');
let expect = chai.expect;

chai.use(require('chai-subset'));

describe('Worksheets', function() {

    let sheetDb;
    let worksheet;
    let sheetName = 'test-sheet';

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

    before(async () => {
        sheetDb = await sheetFactory();
        worksheet = await sheetDb.createWorksheet(sheetName);
    });

    after(async () => {
        if (sheetDb) {
            await sheetDb.dropWorksheet(sheetName);
        }
    });

    beforeEach(async () => {
        await worksheet.remove();
        await testUtil.sleep();
    });

    describe('#find', function() {
        beforeEach(async () => {
            await worksheet.insert(testData, {ordered: true});
        });

        it('should be able to list the whole sheet', async () => {
            let result = await worksheet.find();

            expect(result).to.containSubset(testData);
        });

        it('should be able to filter dataset', async () => {
            let result = await worksheet.find(testSelector);

            expect(result).to.containSubset([testData[2], testData[0]]);
        });

        it('should be able to limit and skip results', async () => {
            let result = await worksheet.find(null, {
                skip: 1,
                limit: 1
            });

            expect(result).to.containSubset([testData[1]]);
        });
    });

    describe('#insert', function() {
        it('should be able to insert objects', async () => {
            await worksheet.insert(testData[0]);
            await worksheet.insert(testData.slice(1));

            let result = await worksheet.find();
            expect(result).all.to.containSubset(testData);
        });
    });

    describe('#remove', function() {

        beforeEach(async () => {
            await worksheet.insert(testData, {ordered: true});
        });

        it('should be able to delete whole worksheet', async () => {
            await worksheet.remove();

            let result = await worksheet.find();
            expect(result).to.eql([]);
        });

        it('should be able to remove selected data', async () => {
            await worksheet.remove(testSelector);

            let result = await worksheet.find();
            expect(result).to.containSubset([testData[1]]);
        });

        it('should be able to remove just one row', async () => {
            await worksheet.remove(null, {justOne: true});

            let result = await worksheet.find();
            expect(result).to.containSubset([testData[1], testData[2]]);
        });
    });

    describe('#update', function() {
        beforeEach(async () => {
            await worksheet.insert(testData);
        });

        it('should be able to update selected data', async () => {
            let descriptor = {
                $set: {c: 'test3'},
                $inc: {d: 1, a: -2}
            };

            await worksheet.update(testSelector, descriptor, {multiple: true});

            let result = await worksheet.find();
            expect(result).to.containSubset([
                {a: -1, b: 'test'},
                {c: 'test3', d: 6.6}
            ]);
        });

        it('should be able to replace object', async () => {
            let descriptor = {
                b: 'test5',
            };

            await worksheet.update({b: 'test'}, descriptor);

            let result = await worksheet.find();
            expect(result).to.containSubset([{a: 1, b: 'test5'}]);
        });

        it('should not touch data set if nothing is selected', async () => {
            let selector = {
                a: {$gt: 169}
            };

            let descriptor = {
                $inc: {a: 4}
            };

            await worksheet.update(selector, descriptor);

            let result = await worksheet.find();
            expect(result).to.containSubset(testData);
        });

        it('should not touch data set if update descriptor updates nothing', async () => {
            let descriptor = {
                $set: {notExists: 'nope'}
            };

            await worksheet.update(testSelector, descriptor, {multiple: true});

            let result = await worksheet.find();
            expect(result).to.containSubset(testData);
        });
    });
});
