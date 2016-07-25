'use strict';

require("babel-polyfill");

var util = require('../../lib/util');
var testUtil = require('./test_util');
var expect   = require('chai').expect;

describe('Util', function() {

    describe('#coercevalue', function() {

        var testCases = [{
            name: 'should coerce integer',
            data: '42',
            expected: 42
        }, {
            name: 'should coerce dotted float',
            data: '42.1',
            expected: 42.1
        }, {
            name: 'should coerce comma float',
            data: '42,1',
            expected: 42.1
        }, {
            name: 'should leave string untouched',
            data: 'Test string',
            expected: 'Test string'
        }, {
            name: 'should coerce Date',
            data: '2015-04-07T22:58:53.274Z',
            expected: new Date('2015-04-07T22:58:53.274Z')
        }];

        testUtil.runTests(testCases, util.coerceValue);
    });

    describe('#coerceNumber', function() {

        it('should handle null values', function() {
           expect(util.coerceNumber(null)).to.not.be.ok;
        });

        it('should leave numbers intact', function() {
            expect(util.coerceNumber(5.14)).to.be.eql(5.14);
        });
    });

    describe('#coerceDate', function() {

        it('should handle null values', function() {
           expect(util.coerceDate(null)).to.not.be.ok;
        });

        it('should leave numbers intact', function() {
            let date = new Date();
            expect(util.coerceDate(date)).to.be.eql(date);
        });
    });

    describe('#getArrayFields', function() {

        var testCases = [{
            name: 'should query simple array',
            data: [[{a: 1, b: 2}, {c: 3, d: 4}]],
            expected: ['a', 'b', 'c', 'd']
        }, {
            name: 'should query array with same elements',
            data: [[{a: 1}, {a: 1}]],
            expected: ['a']
        }, {
            name: 'should handle empty array',
            data: [[]],
            expected: []
        }, {
            name: 'should handle null',
            data: null,
            expected: []
        }];

        testUtil.runTests(testCases, util.getArrayFields);
    });

    describe('#arrayDiff', function() {

        it('should calculates differences between arrays', function() {
            var arrayTarget = [1, 2, 3, 4];
            var arrayCheck = [5, 6, 1, 2];

            var diff = util.arrayDiff(arrayTarget, arrayCheck);

            expect(diff).to.deep.equal([3, 4]);
        });

        it('should throws error in case of non-array objects', function() {
            var arrayTarget = {};
            var arrayCheck = 5;

            expect(util.arrayDiff.bind(
                util, arrayTarget, arrayCheck)
            ).to.throw(Error);
        });
    });

    describe('#isNaN', function() {

        it('should detect simple NaN', function() {
            expect(util.isNaN(NaN)).to.be.ok;
        });

        it('should detect \'0\'', function() {
            expect(util.isNaN('0')).to.be.ok;
        });
    });
});
