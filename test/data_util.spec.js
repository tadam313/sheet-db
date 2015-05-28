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
});