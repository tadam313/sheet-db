'use strict';

var sampleQueryResponse = require('./fixtures/v3/sample_query');
var sampleSheetInfo = require('./fixtures/v3/sample_sheet_info');
var sampleFieldNames = require('./fixtures/v3/sample_query_fieldnames');

var api  = require('../lib/api/v3');
var testUtil = require('./test_util');
var util = require('util');
var expect = require('chai').expect;

describe('Api_V3', function() {

    describe('#getOperationContext', function() {

        it('should sets the visibility based on the token', function() {
            var authenticated = api.getOperationContext('sheet_info', {token: 'test'});
            var anonymous = api.getOperationContext('sheet_info');

            expect(authenticated.headers).to.have.property('Authorization', 'Bearer test');
            expect(authenticated.url).to.contain('/private/');

            expect(anonymous.headers).to.not.have.property('Authorization');
            expect(anonymous.url).to.contain('/public/');
        });

        it('should set the api version', function() {
            var ctx = api.getOperationContext('sheet_info');

            expect(ctx.headers).to.include({
                'GData-Version': '3.0'
            });
        });

        it('should assign request body', function() {
            var ctx = api.getOperationContext('create_entry', {body: 'test'});

            expect(ctx.body).to.equal('test');
        });

        it('should raise error requesting invalid operation', function() {
            expect(api.getOperationContext.bind(api, 'no_operation'))
                .to.throw(ReferenceError);
        });

        var testCases = [{
            name: 'should creates the correct URLs for sheet_info',
            data: ['sheet_info', {
                sheetId: 'test'
            }],
            expected: 'https://spreadsheets.google.com/feeds/worksheets/test/public/full?alt=json'
        }, {
            name: 'should creates the correct URLs for create_worksheet',
            data: ['create_worksheet', {
                sheetId: 'test',
                token: 'test'}
            ],
            expected: 'https://spreadsheets.google.com/feeds/worksheets/test/private/full'
        }, {
            name: 'should creates the correct URLs for drop_worksheet',
            data: ['drop_worksheet', {
                sheetId: 'test',
                worksheetId: 'testWS',
                token: 'test'
            }],
            expected: 'https://spreadsheets.google.com/feeds/worksheets/test/private/full/testWS'
        }, {
            name: 'should creates the correct URLs for query_worksheet',
            data: ['create_entry', {
                sheetId: 'test',
                worksheetId: 'testWS',
                token: 'test'
            }],
            expected: 'https://spreadsheets.google.com/feeds/list/test/testWS/private/full'
        }, {
            name: 'should creates the correct URLs for query_worksheet',
            data: ['query_worksheet', util._extend({
                sheetId: 'test',
                worksheetId: 'testWS'
            }, api.queryRequest({
                query: 'field1 = 4',
                sort: 'field1',
                descending: true
            }))],
            expected: 'https://spreadsheets.google.com/feeds/list/test/testWS/public/full?' +
                'alt=json&sq=field1%20%3D%204&orderby=column:field1&reverse=true'
        }, {
            name: 'should creates the correct URLs for delete_entry',
            data: ['delete_entry', {
                sheetId: 'test',
                worksheetId: 'testWS',
                token: 'test',
                entityId: 'testR'
            }],
            expected: 'https://spreadsheets.google.com/feeds/list/test/testWS/private/full/testR'
        }, {
            name: 'should creates the correct URLs for query_fields',
            data: ['query_fields', {
                sheetId: 'test',
                worksheetId: 'testWS',
                entityId: 'testR',
                colCount: 3
            }],
            expected: 'https://spreadsheets.google.com/feeds/cells/test/testWS/public/full?' +
                'alt=json&min-row=1&max-row=1&min-col=1&max-col=3'
        }, {
            name: 'should creates the correct URLs for create_field',
            data: ['create_field', {
                sheetId: 'test',
                worksheetId: 'testWS',
                token: 'test',
                cellId: 'R14'
            }],
            expected: 'https://spreadsheets.google.com/feeds/cells/test/testWS/private/full/R14'
        }];

        testUtil.runTests(testCases, function(opType, options) {
            return api.getOperationContext(opType, options).url;
        });
    });

    describe('#queryRequest', function() {

        it('should converts query expression into appropriate query string form', function() {
            var options = api.queryRequest({query: 'field1 >= 5'});

            expect(options.query).to.equal('&sq=field1%20%3E%3D%205');
        });

        it('should converts sorting expression into appropriate query string form', function() {
            var options = api.queryRequest({sort: 'field1', descending: true});

            expect(options.orderBy).to.equal('&orderby=column:field1');
            expect(options.reverse).to.equal('&reverse=true');
        });
    });

    describe('#queryResponse', function() {

        it('should return appropriate data only', function() {
            var converted = api.queryResponse(sampleQueryResponse);

            expect(converted.length).to.equal(3);
            expect(converted).to.eql([{
                _id: 'this_is_an_entryId_1',
                _updated: new Date('2015-03-31T23:19:20.960Z'),
                field1: 1,
                field2: 2
            }, {
                _id: 'this_is_an_entryId_2',
                _updated: new Date('2015-03-31T23:19:20.960Z'),
                field1: 3,
                field2: 4
            }, {
                _id: 'this_is_an_entryId_3',
                _updated: new Date('2015-03-31T23:19:20.960Z'),
                field1: 5,
                field2: 6
            }]);
        });
    });

    describe('#sheetInfoResponse', function() {
        it ('should convert the data', function() {
            var converted = api.sheetInfoResponse(sampleSheetInfo);

            expect(converted.workSheets.length).to.equal(3);
            expect(converted.authors.length).to.equal(1);

            expect(converted).to.eql({
                title: 'Test',
                updated: new Date('2015-04-02T21:25:42.467Z'),
                workSheets: [{
                    worksheetId: 'worksheetId_1',
                    title: 'Sheet1',
                    updated: new Date('2015-04-02T21:25:42.467Z'),
                    colCount: 10,
                    rowCount: 20
                }, {
                    worksheetId: 'worksheetId_2',
                    title: 'Sheet2',
                    updated: new Date('2015-04-02T21:25:42.467Z'),
                    colCount: 20,
                    rowCount: 20
                }, {
                    worksheetId: 'worksheetId_3',
                    title: 'Sheet3',
                    updated: new Date('2015-04-02T21:25:42.467Z'),
                    colCount: 0,
                    rowCount: 0
                }],
                authors: [{
                    name: 'author_name',
                    email: 'author_name@tempuri.org'
                }]
            });
        });
    });

    describe('#queryFieldNames', function() {

        it('should produce appropriate field name responses', function() {
            var converted = api.queryFieldNames(sampleFieldNames);

            expect(converted.length).to.equal(2);
            expect(converted).to.eql([{
                _id: 'cellId1',
                _updated: new Date('2015-04-07T22:58:53.274Z'),
                cell: 'field1'
            }, {
                _id: 'cellId2',
                _updated: new Date('2015-04-07T22:58:53.274Z'),
                cell: 'field2'
            }]);
        });
    });

    describe('#createWorksheetRequest', function() {

        it('should produce the appropriate request payload', function() {
            var sheetOptions = {
                title: 'sheet-title',
                rowCount: 10,
                colCount: 12
            };

            var expected =
                '<title>' + sheetOptions.title  + '</title>' +
                '<gs:rowCount>' + sheetOptions.rowCount + '</gs:rowCount>' +
                '<gs:colCount>' + sheetOptions.colCount + '</gs:colCount>';

            testUtil.assertXMLPayload(expected, api.createWorksheetRequest(sheetOptions));
        });

        it('should coerce int values of row and columncount', function() {
            var sheetOptions = {
                title: 'sheet-title',
                rowCount: NaN,
                colCount: null
            };

            var expected  =
                '<title>' + sheetOptions.title  + '</title>' +
                '<gs:rowCount>50</gs:rowCount>' +
                '<gs:colCount>10</gs:colCount>';

            testUtil.assertXMLPayload(expected, api.createWorksheetRequest(sheetOptions));
        });
    });

    describe('#createEntryRequest', function() {

        it('should produce the appropriate request payload', function() {
            var entry = {
                id: 10,
                field1: 'test',
                field2: 'another_test'
            };

            var expected = '';

            for (var key in entry) {
                if (entry.hasOwnProperty(key)) {
                    expected += '<gsx:' + key + '>' +
                    entry[key] + '</gsx:' + key + '>';
                }
            }

            testUtil.assertXMLPayload(expected, api.createEntryRequest(entry), true);
        });

        it('should handle exotic values', function() {
            var entry = {
                field1: null,
                field2: NaN
            };

            var expected =
                '<gsx:field1>0</gsx:field1>' +
                '<gsx:field2>NaN</gsx:field2>';

            testUtil.assertXMLPayload(expected, api.createEntryRequest(entry), true);
        });
    });

    describe('#createFieldRequest', function() {

        it('should produce the appropriate request payload', function() {
            testUtil.assertXMLPayload(
                '<gs:cell row="1" col="5" inputValue="test"/>',
                api.createFieldRequest('test', 5)
            );
        });

        it('should throws error in case of invalid values', function() {
            var invalidValues = [NaN, null, -5];

            invalidValues.forEach(function(invalid) {
                expect(api.createFieldRequest.bind(
                        {}, 'something', invalid)
                ).to.throw(TypeError);
            });
        });
    });
});
