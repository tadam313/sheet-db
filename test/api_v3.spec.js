'use strict';

var sampleQueryResponse       = require('./fixtures/v3/sample_query');
var sampleSheetInfo           = require('./fixtures/v3/sample_sheet_info');
var sampleFieldNames          = require('./fixtures/v3/sample_query_fieldnames');

var api  = require('../lib/api/v3');
var util = require('util');
var expect = require('chai').expect;

describe('Api_V3', function() {

    describe('#getOperationContext', function() {

        it('sets the visibility based on the token', function() {
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
            opType: 'sheet_info',
            options: {sheetId: 'test'},
            expectation: 'https://spreadsheets.google.com/feeds/worksheets/test/public/full?alt=json'
        }, {
            opType: 'create_worksheet',
            options: {sheetId: 'test', token: 'test'},
            expectation: 'https://spreadsheets.google.com/feeds/worksheets/test/private/full'
        }, {
            opType: 'remove_worksheet',
            options: {sheetId: 'test', worksheetId: 'testWS', token: 'test'},
            expectation: 'https://spreadsheets.google.com/feeds/worksheets/test/private/full/testWS'
        }, {
            opType: 'create_entry',
            options: {sheetId: 'test', worksheetId: 'testWS', token: 'test'},
            expectation: 'https://spreadsheets.google.com/feeds/list/test/testWS/private/full'
        }, {
            opType: 'query_worksheet',
            options: util._extend({
                sheetId: 'test',
                worksheetId: 'testWS'
            }, api.queryRequest({
                query: 'field1 = 4',
                sort: 'field1',
                descending: true
            })),
            expectation: 'https://spreadsheets.google.com/feeds/list/test/testWS/public/full?' +
                'alt=json&sq=field1%20%3D%204&orderby=column:field1&reverse=true'
        }, {
            opType: 'delete_entry',
            options: {
                sheetId: 'test',
                worksheetId: 'testWS',
                token: 'test',
                rowId: 'testR'
            },
            expectation: 'https://spreadsheets.google.com/feeds/list/test/testWS/private/full/testR'
        }, {
            opType: 'query_fields',
            options: {
                sheetId: 'test',
                worksheetId: 'testWS',
                rowId: 'testR',
                colCount: 3
            },
            expectation: 'https://spreadsheets.google.com/feeds/cells/test/testWS/public/full?' +
                'alt=json&min-row=1&max-row=1&min-col=1&max-col=3'
        }, {
            opType: 'create_field',
            options: {
                sheetId: 'test',
                worksheetId: 'testWS',
                token: 'test',
                cellId: 'R14'
            },
            expectation: 'https://spreadsheets.google.com/feeds/cells/test/testWS/private/full/R14'
        }];

        testCases.forEach(function(testCase) {
            it('should creates the correct URLs for ' + testCase.opType, function() {
                var ctx = api.getOperationContext(testCase.opType, testCase.options);
                expect(ctx.url).to.equal(testCase.expectation);
            });
        });
    });

    describe('#queryRequest', function() {

        it('converts query expression into appropriate query string form', function() {
            var options = api.queryRequest({query: 'field1 >= 5'});

            expect(options.query).to.equal('&sq=field1%20%3E%3D%205');
        });

        it('converts sorting expression into appropriate query string form', function() {
            var options = api.queryRequest({sort: 'field1', descending: true});

            expect(options.orderBy).to.equal('&orderby=column:field1');
            expect(options.reverse).to.equal('&reverse=true');
        });
    });

    describe('#queryResponse', function() {

        it('should return appropriate data only', function() {
            var converted = api.queryResponse(sampleQueryResponse);

            expect(converted.length).to.equal(1);
            expect(converted).to.deep.equal([{
                $id: 'this_is_an_entryId',
                $updated: new Date('2015-03-31T23:19:20.960Z'),
                test1: 1,
                test2: 2
            }]);
        });
    });

    describe('#sheetInfoResponse', function() {
        it ('should convert the data', function() {
            var converted = api.sheetInfoResponse(sampleSheetInfo);

            expect(converted.workSheets.length).to.equal(3);
            expect(converted.authors.length).to.equal(1);

            expect(converted).to.deep.equal({
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
            expect(converted).to.deep.equal([{
                $id: 'cellId1',
                $updated: new Date('2015-04-07T22:58:53.274Z'),
                cell: 'test1'
            }, {
                $id: 'cellId2',
                $updated: new Date('2015-04-07T22:58:53.274Z'),
                cell: 'test2'
            }]);
        });
    });

    describe('#createWorksheetRequest', function() {

        var assertRequastPayload = function(options, expected) {

            var payload = api.createWorksheetRequest(options);

            expect(payload).to.equal(
                '<entry xmlns="http://www.w3.org/2005/Atom"' +
                ' xmlns:gs="http://schemas.google.com/spreadsheets/2006">' +
                expected +
                '</entry>'
            );
        };

        // TODO: use XML library ot make the attribute order in the expected XML string independent
        it('should produce the appropriate request payload', function() {
            var sheetOptions = {
                title: 'sheet-title',
                rowCount: 10,
                colCount: 12
            };

            assertRequastPayload(sheetOptions,
                '<title>' + sheetOptions.title  + '</title>' +
                '<gs:rowCount>' + sheetOptions.rowCount + '</gs:rowCount>' +
                '<gs:colCount>' + sheetOptions.colCount + '</gs:colCount>'
            );
        });

        it('should coerce int values of row and columncount', function() {
            var sheetOptions = {
                title: 'sheet-title',
                rowCount: NaN,
                colCount: null
            };

            assertRequastPayload(sheetOptions,
                '<title>' + sheetOptions.title  + '</title>' +
                '<gs:rowCount>10</gs:rowCount>' +
                '<gs:colCount>10</gs:colCount>'
            );
        });
    });

    describe('#createEntryRequest', function() {

        // TODO: use XML library ot make the attribute order in the expected XML string independent
        it('should produce the appropriate request payload', function() {
            var entry = {
                id: 10,
                field1: 'test',
                field2: 'another_test'
            };

            var expected = '<entry xmlns="http://www.w3.org/2005/Atom"' +
                ' xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended">';

            for (var key in entry) {
                if (entry.hasOwnProperty(key)) {
                    expected += '<gsx:' + key + '>' +
                    entry[key] + '</gsx:' + key + '>';
                }
            }

            expected += '</entry>';

            var payload = api.createEntryRequest(entry);
            expect(payload).to.equal(expected);
        });

        it('should handle exotic values', function() {
            var entry = {
                field1: null,
                field2: NaN
            };

            var expected =
                '<entry xmlns="http://www.w3.org/2005/Atom"' +
                ' xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended">' +
                '<gsx:field1>0</gsx:field1>' +
                '<gsx:field2>NaN</gsx:field2>' +
                '</entry>';

            var payload = api.createEntryRequest(entry);
            expect(payload).to.equal(expected)
        });
    });

    describe('#createFieldRequest', function() {

        it('should produce the appropriate request payload', function() {
            var payload = api.createFieldRequest('test', 5);

            expect(payload).to.equal(
                '<entry xmlns="http://www.w3.org/2005/Atom"' +
                ' xmlns:gs="http://schemas.google.com/spreadsheets/2006">' +
                '<gs:cell row="1" col="5" inputValue="test"/>' +
                '</entry>');
        });

        it('should throws error in case of invalid values', function() {
            var invalidValues = [NaN, null, -5];

            invalidValues.forEach(function(invalid) {
                expect(api.createFieldRequest.bind(
                        api,
                        'something',
                        invalid)
                ).to.throw(TypeError);
            });
        });
    });
});
