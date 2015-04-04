"use strict";

var queryParser     = require('../lib/query_parser'),
    assert          = require('assert');

describe('Query Parser', function() {

    describe('#parse', function() {

        var testCases = [{
            name: 'Simple operator',
            query: {  field1: { $gt: 10 } },
            expectation: 'field1 > 10'
        }, {
            name: 'Or operator',
            query: {
                $or: [{
                    field1: { $lt: 13 }
                }, {
                    field2: { $gt: 15 }
                }]
            },
            expectation: 'field1 < 13 or field2 > 15'
        }, {
            name: 'And operator',
            query: {
                $and: [{
                    field1: { $lte: 20 }
                }, {
                    field2: { $gte: 20 }
                }]
            },
            expectation: 'field1 <= 20 and field2 >= 20'
        }, {
            name: 'Empty query',
            query: {},
            expectation: ''
        }, {
            name: 'Null query',
            query: null,
            expectation: ''
        }];


        testCases.forEach(function(testCase) {

            it(testCase.name, function() {
                var resultQuery = queryParser.parse(testCase.query);
                assert.equal(resultQuery, testCase.expectation);
            });
        });
    });

});