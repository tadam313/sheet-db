'use strict';

var query = require('../lib/query');
var testUtil = require('./test_util');

describe('QueryHelper', function() {

    describe('#stringify', function() {

        var testCases = [{
            name: 'should convert simple operator',
            data: {
                field1: {$gt: 10}
            },
            matches: /^field1\s*>\s*10$/
        }, {
            name: ' should convert or operator',
            data: {
                $or: [{
                    field1: {$lt: 13}
                }, {
                    field2: {$gt: 15}
                }]
            },
            matches: /^\(field1\s*<\s*13\s*or\s*field2\s*>\s*15\)$/
        }, {
            name: 'should convert and operator',
            data: {
                $and: [{
                    field1: {$lte: 20}
                }, {
                    field2: {$gte: 20}
                }]
            },
            matches: /^\(field1\s*<=\s*20\s*and\s*field2\s*>=\s*20\)$/
        }, {
            name: 'should wrap strings in enclosure',
            data: {
                $or: [{
                    field1: {$eq: 'test1'}
                }, {
                    field2: {$eq: 'test2'}
                }]
            },
            matches: /^\(field1\s*=\s*"test1"\s*or\s*field2\s*=\s*"test2"\)$/
        }, {
            name: 'should convert plain simple equality comparision',
            data: {
                field1: 15
            },
            matches: /field1\s*=\s*15/
        }, {
            name: 'should convert containment expression',
            data: {
                field1: {$in: [1, 2, 3]}
            },
            matches: /^\(field1\s*=\s*1\s*or\s*field1\s*=\s*2\s*or\s*field1\s*=\s*3\)$/
        }, {
            name: 'should convert containment expression negation',
            data: {
                field1: {$nin: [1, 2, 3]}
            },
            matches: /^\(field1\s*<>\s*1\s*and\s*field1\s*<>\s*2\s*and\s*field1\s*<>\s*3\)$/
        }, {
            name: 'should convert composite querystring.escape(str);',
            data: {
                $and: [{
                    fld1: 5
                }, {
                    fld2: {
                        $or: [{
                            $gt: 5
                        }, {
                            $in: [4, 5]
                        }]
                    }
                }]
            },
            matches: /^\(fld1\s*=\s*5\s*and\s*\(fld2\s*>\s*5\s*or\s*\(fld2\s*=\s*4\s*or\s*fld2\s*=\s*5\s*\)\)\)$/
        }, {
            name: 'should skip not supported operation',
            data: {
                field1: {$type: Date}
            },
            matches: /^$/
        }, {
            name: 'should convert interlan properties queries',
            data: {$id: 5},
            matches: /\$id\s*=\s*5/
        }, {
            name: 'should handle empty query',
            data: {},
            matches: /^$/
        }, {
            name: 'should handle null',
            data: null,
            matches: /^$/
        }];

        testUtil.runTests(testCases, query.stringify);
    });

    describe('#isUpdateDescriptor', function() {

        var testCases = [{
            name: 'should recognize POJO',
            data: {field1: 1},
            expected: false
        }, {
            name: 'should recognize simple datariptor#1',
            data: {$set: {field1: 5}},
            expected: true
        }, {
            name: 'should recognize simple datariptor#2',
            data: {$currentDate: {field1: true}},
            expected: true
        }, {
            name: 'should handle null',
            data: null,
            expected: false
        }];

        testUtil.runTests(testCases, query.isUpdateDescriptor);
    });

    describe('#updateObject', function() {
        var testCases = [{
            name: 'should handle simple assignment',
            data: [
                {field1: 5, field2: 'foo'},
                {$set: {field1: 42, field2: 'bar'}}
            ],
            expected: {field1: 42, field2: 'bar'}
        }, {
            name: 'should handle composite assignment',
            data: [
                {field1: 5, field2: 6},
                {$set: {field1: null}, $currentDate: {field2: true, field1: false}}
            ],
            expected: {field1: null, field2: new Date(0)}
        }, {
            name: 'should handle assignment of array',
            data: [
                [{field1: 5}, {field1: 10}],
                {$set: {field1: 15}}
            ],
            expected: [{field1: 15}, {field1: 15}]
        }, {
            name: 'should handle inc operator',
            data: [
                {field1: 6},
                {$inc: {field1: 10}}
            ],
            expected: {field1: 16}
        }, {
            name: 'should handle mul operator',
            data: [
                {field1: 6},
                {$mul: {field1: 2}}
            ],
            expected: {field1: 12}
        }, {
            name: 'should handle min operator',
            data: [
                {field1: 6},
                {$min: {field1: 2}}
            ],
            expected: {field1: 2}
        }, {
            name: 'should skip min operator',
            data: [
                {field1: 6},
                {$min: {field1: 7}}
            ],
            expected: {field1: 6}
        }, {
            name: 'should handle max operator',
            data: [
                {field1: 6},
                {$max: {field1: 10}}
            ],
            expected: {field1: 10}
        }, {
            name: 'should skip max operator',
            data: [
                {field1: 6},
                {$max: {field1: 2}}
            ],
            expected: {field1: 6}
        }, {
            name: 'should assign only existent properties',
            data: [
                {field1: 5},
                {$set: {field2: 10}}
            ],
            expected: {field1: 5}
        }, {
            name: 'should handle replace object',
            data: [
                {field1: 5},
                {field2: 42}
            ],
            expected: {field2: 42}
        }, {
            name: 'should handle skip invalid descriptor',
            data: [
                {field1: 42},
                null
            ],
            expected: {field1: 42}
        }];

        testUtil.runTests(testCases, query.updateObject);
    });
});
