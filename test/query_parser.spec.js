'use strict';

var queryParser     = require('../lib/query_parser');
var expect          = require('chai').expect;

describe('QueryParser', function() {

    describe('#parse', function() {

        var testCases = [{
            name: 'Simple operator',
            query: {
                field1: {
                    $gt: 10
                }
            },
            expectation: 'field1 > 10'
        }, {
            name: 'Or operator',
            query: {
                $or: [{
                    field1: {
                        $lt: 13
                    }
                }, {
                    field2: {
                        $gt: 15
                    }
                }]
            },
            expectation: '(field1 < 13 or field2 > 15)'
        }, {
            name: 'And operator',
            query: {
                $and: [{
                    field1: {
                        $lte: 20
                    }
                }, {
                    field2: {
                        $gte: 20
                    }
                }]
            },
            expectation: '(field1 <= 20 and field2 >= 20)'
        }, {
            name: 'Wrap strings in enclosure',
            query: {
                $or: [{
                    field1: {
                        $eq: 'test1'
                    }
                }, {
                    field2: {
                        $eq: 'test2'
                    }
                }]
            },
            expectation: '(field1 = "test1" or field2 = "test2")'
        }, {
            name: 'Plain simple equality comparision',
            query: {
                field1: 15
            },
            expectation: 'field1 = 15'
        }, {
            name: 'Containment expression',
            query: {
                field1: {
                    $in: [1, 2, 3]
                }
            },
            expectation: '(field1 = 1 or field1 = 2 or field1 = 3)'
        }, {
            name: 'Composite query',
            query: {
                $and: [{
                    field1: 5
                }, {
                    field2: {
                        $and: [{
                            $gte: 5
                        }, {
                            $eq: 6
                        }, {
                            $in: [4, 5, 6]
                        }]
                    }
                }]
            },
            expectation: '(field1 = 5 and (field2 >= 5 and field2 = 6 and (field2 = 4 or field2 = 5 or field2 = 6)))'
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
                expect(resultQuery).to.equal(testCase.expectation);
            });
        });
    });
});
