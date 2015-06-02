'use strict';

var sampleQueryResponse       = require('./fixtures/v3/sample_query');
var sampleSheetInfo           = require('./fixtures/v3/sample_sheet_info');
var sampleFieldNames          = require('./fixtures/v3/sample_query_fieldnames');

var api  = require('../lib/api/v3');
var expect = require('chai').expect;

describe('ModelConverter', function() {

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
