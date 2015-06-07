'use strict';

var Worksheet = require('../lib/worksheet');
var clientFactory = require('../lib/rest_client');
var query = require('../lib/query');
var testUtil = require('./test_util');
var chai = require('chai');
var sinon = require('sinon');

var sampleQueryResponse = require('./fixtures/v3/sample_query');
var sampleFieldQueryResponse = require('./fixtures/v3/sample_query_fieldnames');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Worksheet', function() {

    var worksheet;
    var restClient = clientFactory();
    var spy;
    var queryWorksheetStub;
    var queryFieldsStub;
    var insertEntriesStub;
    var updateEntriesStub;
    var deleteEntriesStub;
    var createColumnsStub;

    beforeEach(function() {
        queryWorksheetStub = sinon.stub(restClient, 'queryWorksheet');
        queryWorksheetStub.yields(null, restClient.getApi().queryResponse(sampleQueryResponse));

        queryFieldsStub = sinon.stub(restClient, 'queryFields');
        queryFieldsStub.yields(null, restClient.getApi().queryFieldNames(sampleFieldQueryResponse));

        insertEntriesStub = sinon.stub(restClient, 'insertEntries');
        insertEntriesStub.yields(null);

        updateEntriesStub = sinon.stub(restClient, 'updateEntries');
        updateEntriesStub.yields(null);

        deleteEntriesStub = sinon.stub(restClient, 'deleteEntries');
        deleteEntriesStub.yields(null);

        createColumnsStub = sinon.stub(restClient, 'createColumns');
        createColumnsStub.yields(null);

        spy = sinon.spy();
        worksheet = new Worksheet('test', {}, restClient);
    });

    afterEach(function() {
        queryWorksheetStub.restore();
        queryFieldsStub.restore();
        insertEntriesStub.restore();
        updateEntriesStub.restore();
        deleteEntriesStub.restore();
        createColumnsStub.restore();
    });

    describe('#find', function() {

        it('should list the whole worksheet if selector is empty', function() {
            // arrange
            var selector = {};

            // act
            worksheet.find(selector, spy);

            // assert
            expect(queryWorksheetStub).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWithExactly(null, [
                sinon.match({$id: 'this_is_an_entryId_1'}),
                sinon.match({$id: 'this_is_an_entryId_2'}),
                sinon.match({$id: 'this_is_an_entryId_3'})
            ]);
        });

        it('should limit collection', function() {
            // arrange
            var options = {limit: 2};

            // act
            worksheet.find(null, options, spy);

            //assert
            expect(spy).to.have.been.calledWithExactly(null, [
                sinon.match({$id: 'this_is_an_entryId_1'}),
                sinon.match({$id: 'this_is_an_entryId_2'})
            ]);
        });

        it('should skip items', function() {
            // arrange
            var options = {skip: 2};

            // act
            worksheet.find(null, options, spy);

            //assert
            expect(spy).to.have.been.calledWithExactly(null, [
                sinon.match({$id: 'this_is_an_entryId_3'})
            ]);
        });

        it('should filter properly also on the client side', function() {
            // act
            worksheet.find({field1: {$gte: 2}}, spy);

            //assert
            expect(spy).to.have.been.calledWithExactly(null, [
                sinon.match({$id: 'this_is_an_entryId_2'}),
                sinon.match({$id: 'this_is_an_entryId_3'})
            ]);
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(queryWorksheetStub, function(spy) {
                worksheet.find(spy);
            });
        });
    });

    describe('#insert', function() {

        it('should call the api', function() {
            // arrange
            var entry = {field1: 3, field2: 10};

            // act
            worksheet.insert(entry, testUtil.identFunc);

            // assert
            expect(queryFieldsStub).to.have.been.calledOnce;
            expect(insertEntriesStub).to.have.been.calledOnce;
            expect(insertEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field2: 10}]
            );
        });

        it('should handle null values', function() {
            // act
            worksheet.insert(null, spy);

            // assert
            expect(spy).to.have.been.called;
        });

        it('should insert columns if the sheet does not contain them', function() {
            // arrange
            var entry = {field1: 3, field3: 10, field5: 20};

            // act
            worksheet.insert(entry, testUtil.identFunc);

            // assert
            expect(queryFieldsStub).to.have.been.calledOnce;
            expect(insertEntriesStub).to.have.been.calledOnce;

            expect(insertEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field3: 10, field5: 20}]
            );

            expect(createColumnsStub).to.have.been.calledWith(
                {sheetId: 'test'}, ['field3', 'field5']
            );
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(insertEntriesStub, function(spy) {
                worksheet.insert({}, spy);
            });
        });
    });

    describe('#update', function() {

        it('should call the api', function() {
            var entry = {field1: 'test'};

            // act
            worksheet.update({field1: 1}, entry, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.have.been.calledOnce;
            expect(updateEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, entry
            );
        });

        it('should update only single entity by default', function() {
            // arrange
            var findStub = sinon.stub(worksheet, 'find');
            findStub.yields(null, [{}]);

            // act
            worksheet.update(null, null, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith(
                null, sinon.match({limit: 1})
            );

            findStub.restore();
        });

        it('should have the ability to update multiple entities', function() {
            // arrange
            var findStub = sinon.stub(worksheet, 'find');
            findStub.yields(null, [{}]);

            // act
            worksheet.update(null, null, {multiple: true}, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith(
                null, sinon.match({limit: Number.MAX_VALUE})
            );

            findStub.restore();
        });

        it('should insert value if not exists and upsert option is set', function() {
            // arrange
            var entry = {field1: 1};
            var findStub = sinon.stub(worksheet, 'find');
            findStub.yields(null, []);

            // act
            worksheet.update(null, entry, {upsert: true}, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.not.have.been.called;
            expect(insertEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, entry
            );

            findStub.restore();
        });

        it('should NOT insert value if not exists and upsert option is NOT set', function() {
            // arrange
            var entry = {field1: 1};
            var findStub = sinon.stub(worksheet, 'find');
            findStub.yields(null, []);

            // act
            worksheet.update(null, entry, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.not.have.been.called;
            expect(insertEntriesStub).to.not.have.been.called;
            findStub.restore();
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(updateEntriesStub, function(spy) {
                worksheet.update(null, null, spy);
            });
        });
    });

    describe('#delete', function() {

        it('should call the api', function() {
            // arrange
            var selector = {field1: 1};

            // act
            worksheet.delete(selector, testUtil.identFunc);

            // assert
            expect(deleteEntriesStub).to.have.been.calledOnce;
            expect(deleteEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, ['this_is_an_entryId_1']
            );
        });

        it('should directly call deleteEntry without find if selector contains only $id (performance...)', function() {
            // arrange
            var selector = {$id: 'test'};

            // act
            worksheet.delete(selector, testUtil.identFunc);

            // assert
            expect(deleteEntriesStub).to.have.been.calledOnce;
            expect(queryWorksheetStub).to.not.have.been.called;
            expect(deleteEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, 'test'
            );
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(deleteEntriesStub, function(spy) {
                worksheet.delete(spy);
            });
        });
    });

    describe('#listColumns', function() {

        it('should call the api', function() {
            // act
            worksheet.listColumns(spy);

            expect(queryFieldsStub).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith(null, [
                sinon.match({cell: 'field1'}),
                sinon.match({cell: 'field2'})
            ]);
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(queryFieldsStub, function(spy) {
                worksheet.listColumns(spy);
            });
        });
    });

    describe('#createColumns', function() {

        it('should get column list every time to check existing columns', function() {
            // arrange
            var fields = ['field3', 'field4'];

            // act
            worksheet.createColumns(fields, testUtil.identFunc);

            // assert
            expect(createColumnsStub).to.have.been.calledOnce;
            expect(queryFieldsStub).to.have.been.calledOnce;
            expect(createColumnsStub).to.have.been.calledWith(
                {sheetId: 'test'}, fields, 2
            );
        });

        it('should create only new columns', function() {
            // arrange
            var fields = ['field2', 'field3'];

            // act
            worksheet.createColumns(fields, testUtil.identFunc);

            // assert
            expect(createColumnsStub).to.have.been.calledOnce;
            expect(createColumnsStub).to.have.been.calledWith(
                {sheetId: 'test'}, ['field3'], 2
            );
        });

        it('should reports api error', function() {
            testUtil.assertFuncReportsError(createColumnsStub, function(spy) {
                worksheet.createColumns(['field1'], spy);
            });
        });
    });
});
