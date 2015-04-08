"use strict";

var sample_query_response       = require('./fixtures/sample_query'),
    sample_sheet_info           = require('./fixtures/sample_sheet_info'),
    sample_worksheet_creation   = require('./fixtures/sample_worksheet_creation'),
    sample_entry_creation       = require('./fixtures/sample_entry_creation'),
    sample_field_names          = require('./fixtures/sample_query_fieldnames');

var modelConverter  = require('../lib/model_converter'),
    assert          = require('assert');

describe('ModelConverter', function() {

    describe('#getItemIdFromUrl', function() {

        it('should return a last segment of the URI', function() {
            var sampleUrl = 'http://tempuri.org/test/this_is_an_id';

            var id = modelConverter.getItemIdFromUrl(sampleUrl);

            assert.equal(id, 'this_is_an_id');
        });
    });

    describe('#queryResponse', function() {

        it('should return appropriate data only', function () {
            var converted = modelConverter.queryResponse(sample_query_response);

            assert.equal(converted.length, 1);
            assert.deepEqual(converted, [{
                $id: 'this_is_an_entryId',
                $updated: new Date('2015-03-31T23:19:20.960Z'),
                test1: 1,
                test2: 2
            }]);
        });
    });

    describe('#sheetInfoResponse', function() {

        it ('should convert the data', function() {
            var converted = modelConverter.sheetInfoResponse(sample_sheet_info);

            assert.equal(converted.workSheets.length, 3);
            assert.equal(converted.authors.length, 1);

            assert.deepEqual(converted, {
                title: 'Test',
                updated: new Date('2015-04-02T21:25:42.467Z'),
                workSheets: [{
                    id: 'worksheetId_1',
                    title: 'Sheet1',
                    updated: new Date('2015-04-02T21:25:42.467Z'),
                    colCount: 10,
                    rowCount: 20
                }, {
                    id: 'worksheetId_2',
                    title: 'Sheet2',
                    updated: new Date('2015-04-02T21:25:42.467Z'),
                    colCount: 20,
                    rowCount: 20
                }, {
                    id: 'worksheetId_3',
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

    describe('#createWorksheetResponse', function() {

        it('should convert data', function() {
            var converted = modelConverter.createWorksheetResponse(sample_worksheet_creation);

            assert.deepEqual(converted, {
                id: 'worksheetId_1',
                title: 'Sheet1',
                updated: new Date('2015-03-27T10:23:07.895Z'),
                colCount: 10,
                rowCount: 10
            });
        });
    });

    describe('#createEntryResponse', function() {

        it('should convert data', function() {
            var converted = modelConverter.createEntryResponse(sample_entry_creation);

            assert.deepEqual(converted, {
                $id: 'entryId',
                $updated: new Date('2015-03-27T13:11:28.820Z'),
                test_field_1: 'test_string1',
                test_field_2: 'test_string2'
            });
        });
    });

    describe('#createWorksheetRequest', function() {

        // TODO: use XML library ot make the attribute order in the expected XML string independent
        it('should produce the appropriate request payload', function() {
            var sheetOptions = {
                title: 'sheet-title',
                rowCount: 10,
                colCount: 12
            };

            var payload = modelConverter.createWorksheetRequest(sheetOptions);

            assert.equal(payload,
                '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gs="http://schemas.google.com/spreadsheets/2006">' +
                    '<title>' + sheetOptions.title  + '</title>' +
                    '<gs:rowCount>' + sheetOptions.rowCount + '</gs:rowCount>' +
                    '<gs:colCount>' + sheetOptions.colCount + '</gs:colCount>' +
                '</entry>');
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

            var expected = '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended">';

            for (var key in entry) {
                if (entry.hasOwnProperty(key)) {
                    expected += '<gsx:' + key + '>' + entry[key]  + '</gsx:' + key + '>';
                }
            }

            expected += '</entry>';

            var payload = modelConverter.createEntryRequest(entry);
            assert.equal(payload, expected);
        });
    });

    describe('#queryFieldNames', function() {

        it('should produce appropriate field name responses', function() {
            var converted = modelConverter.queryFieldNames(sample_field_names);

            assert.equal(converted.length, 2);
            assert.deepEqual(converted, [{
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
});