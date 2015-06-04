'use strict';

var query = require('../lib/query');
var testUtil = require('./test_util');

describe('QueryHelper', function() {

    describe('#stringify', function() {

        var testCases = [{
            name: 'Simple operator',
            data: {
                field1: {$gt: 10}
            },
            expected: 'field1 > 10'
        }, {
            name: 'Or operator',
            data: {
                $or: [{
                    field1: {$lt: 13}
                }, {
                    field2: {$gt: 15}
                }]
            },
            expected: '(field1 < 13 or field2 > 15)'
        }, {
            name: 'And operator',
            data: {
                $and: [{
                    field1: {$lte: 20}
                }, {
                    field2: {$gte: 20}
                }]
            },
            expected: '(field1 <= 20 and field2 >= 20)'
        }, {
            name: 'Wrap strings in enclosure',
            data: {
                $or: [{
                    field1: {$eq: 'test1'}
                }, {
                    field2: {$eq: 'test2'}
                }]
            },
            expected: '(field1 = "test1" or field2 = "test2")'
        }, {
            name: 'Plain simple equality comparision',
            data: {
                field1: 15
            },
            expected: 'field1 = 15'
        }, {
            name: 'Containment expression',
            data: {
                field1: {$in: [1, 2, 3]}
            },
            expected: '(field1 = 1 or field1 = 2 or field1 = 3)'
        }, {
            name: 'Containment expression negation',
            data: {
                field1: {$nin: [1, 2, 3]}
            },
            expected: '(field1 <> 1 and field1 <> 2 and field1 <> 3)'
        }, {
            name: 'Composite data',
            data: {
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
            expected: '(field1 = 5 and (field2 >= 5 and field2 = 6 and (field2 = 4 or field2 = 5 or field2 = 6)))'
        }, {
            name: 'Empty data',
            data: {},
            expected: ''
        }, {
            name: 'Null data',
            data: null,
            expected: ''
        }];

        testUtil.runTests(testCases, query.stringify);
    });

    describe('#isMutatorDescriptor', function() {

        var testCases = [{
            name: 'POJO',
            data: {field1: 1},
            expected: false
        }, {
            name: 'Simple datariptor#1',
            data: {$set: {field1: 5}},
            expected: true
        }, {
            name: 'Simple datariptor#2',
            data: {$currentDate: {field1: true}},
            expected: true
        }, {
            name: 'Null object',
            data: null,
            expected: false
        }];

        testUtil.runTests(testCases, query.isMutatorDescriptor);
    });

    describe('#mutateObject', function() {
        var testCases = [{
            name: 'Simple assignment',
            data: [
                {field1: 5, field2: 'foo'},
                {$set: {field1: 42, field2: 'bar'}}
            ],
            expected: {field1: 42, field2: 'bar'}
        }, {
            name: 'Composite assignment',
            data: [
                {field1: 5, field2: 6},
                {$set: {field1: null}, $currentDate: {field2: true, field1: false}}
            ],
            expected: {field1: null, field2: new Date(0)}
        }, {
            name: 'Replace object',
            data: [
                {field1: 5},
                {field2: 42}
            ],
            expected: {field2: 42}
        }, {
            name: 'Invalid descriptor',
            data: [
                {field1: 42},
                null
            ],
            expected: {field1: 42}
        }];

        testUtil.runTests(testCases, query.mutateObject);
    });
});
