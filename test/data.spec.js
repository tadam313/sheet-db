'use strict';

var util = require('../lib/util');
var testUtil = require('./test_util');
var expect   = require('chai').expect;

describe('DataUtil', function() {

    describe('#coerceNumber', function() {

        var testCases = [{
            name: 'Simple integer',
            data: '42',
            expected: 42
        }, {
            name: 'Simple dotted float',
            data: '42.1',
            expected: 42.1
        }, {
            name: 'Simple comma float',
            data: '42,1',
            expected: 42.1
        }, {
            name: 'Simple string',
            data: 'Test string',
            expected: 'Test string'
        }, {
            name: 'Date String',
            data: '2015-04-07T22:58:53.274Z',
            expected: '2015-04-07T22:58:53.274Z'
        }];

        testUtil.runTests(testCases, util.coerceNumber);
    });

    describe('#getArrayFields', function() {

        var testCases = [{
            name: 'Simple array',
            data: [[{a: 1, b: 2}, {c: 3, d: 4}]],
            expected: ['a', 'b', 'c', 'd']
        }, {
            name: 'Array with same elements',
            data: [[{a: 1}, {a: 1}]],
            expected: ['a']
        }, {
            name: 'Empty array',
            data: [[]],
            expected: []
        }, {
            name: 'Null',
            data: null,
            expected: []
        }];

        testUtil.runTests(testCases, util.getArrayFields);
    });

    describe('#arrayDiff', function() {

        it('Calculates differences between arrays', function() {
            var arrayTarget = [1, 2, 3, 4];
            var arrayCheck = [5, 6, 1, 2];

            var diff = util.arrayDiff(arrayTarget, arrayCheck);

            expect(diff).to.deep.equal([3, 4]);
        });

        it('Throws exception in case of non-array objects', function() {
            var arrayTarget = {};
            var arrayCheck = 5;

            expect(util.arrayDiff.bind(
                util, arrayTarget, arrayCheck)
            ).to.throw(Error);
        });
    });
});
