"use strict";

var data_util = require('../lib/data_util');
var assert    = require('assert');

describe('DataUtil', function() {

    describe('#convertValue', function() {

        var testCases = [{
            name: 'Simple integer',
            value: '42',
            expectation: 42
        }, {
            name: 'Simple dotted float',
            value: '42.1',
            expectation: 42.1
        }, {
            name: 'Simple comma float',
            value: '42,1',
            expectation: 42.1
        }, {
            name: 'Simple string',
            value: 'Test string',
            expectation: 'Test string'
        }, {
            name: 'Date String',
            value: '2015-04-07T22:58:53.274Z',
            expectation: '2015-04-07T22:58:53.274Z'
        }];

        testCases.forEach(function(testCase) {
            it(testCase.name, function() {
                var resultQuery = data_util.convertValue(testCase.value);
                assert.equal(resultQuery, testCase.expectation);
            });
        });
    });

    describe('#getArrayFields', function() {

        var testCases = [{
            name: 'Simple array',
            value: [{ a: 1, b: 2}, { c: 3, d: 4}],
            expectation: ['a', 'b', 'c', 'd']
        }, {
            name: 'Array with same elements',
            value: [{a: 1}, {a: 1}],
            expectation: ['a']
        }, {
            name: 'Empty array',
            value: [],
            expectation: []
        }, {
            name: 'Null',
            value: null,
            expectation: []
        }];

        testCases.forEach(function(testCase) {
            it(testCase.name, function() {
                var resultQuery = data_util.getArrayFields(testCase.value);
                assert.deepEqual(resultQuery, testCase.expectation);
            });
        });
    });

    describe('#arrayDiff', function() {

        it('Calculates differences between arrays', function() {
            var arrayTarget = [1, 2, 3, 4 ];
            var arrayCheck = [5, 6, 1, 2];

            var diff = data_util.arrayDiff(arrayTarget, arrayCheck);

            assert.deepEqual(diff, [3, 4]);
        });

        it('throws exception in case of non-array objects', function() {
            var arrayTarget = {};
            var arrayCheck = 5;
            var thrown = false;

            try {
                data_util.arrayDiff(arrayTarget, arrayCheck);
            } catch (err) {
                thrown = true;
            }

            assert.equal(thrown, true);
        });
    });
});