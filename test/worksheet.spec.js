var Worksheet = require('../lib/worksheet');
var clientFactory = require('../lib/rest_client');
var query = require('../lib/query');
var testUtil = require('./test_util');
var chai = require('chai');
var sinon = require('sinon');

var sampleQueryResponse = require('./fixtures/v3/sample_query');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Worksheet', function() {

    var workSheet;
    var spy;
    var restClient = clientFactory('v3', 'test');

    beforeEach(function() {
        workSheet = new Worksheet('test', {}, restClient);
        spy = sinon.spy();
    });

    describe('#find', function() {

        var queryWorksheet;

        beforeEach(function() {
            queryWorksheet = sinon
                .stub(restClient, 'queryWorksheet')
                .yields(null, restClient.getApi().queryResponse(sampleQueryResponse)
            );
        });

        afterEach(function() {
            queryWorksheet.restore();
        });

        it('should call api with proper args', function() {
            // arrange
            var testQuery = {field1: 5};

            // act
            workSheet.find(testQuery, testUtil.identFunc);

            // assert
            expect(queryWorksheet).to.have.been.calledOnce;
            expect(queryWorksheet).to.have.been.calledWith(
                {sheetId: 'test'},
                query.stringify(testQuery)
            );
        });

        it('should report error', function() {
            // arrange
            var err = new Error('test');
            queryWorksheet.yields(err);

            // act
            workSheet.find(spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(err);
        });

        it('limit collection', function() {
            // arrange
            var options = {limit: 2};

            // act
            workSheet.find(null, options, spy);

            //assert
            expect(spy).to.have.been.calledWithExactly(null, [
                sinon.match({$id: 'this_is_an_entryId_1'}),
                sinon.match({$id: 'this_is_an_entryId_2'})
            ]);
        });

        it('skip items', function() {
            // arrange
            var options = {skip: 2};

            // act
            workSheet.find(null, options, spy);

            //assert
            expect(spy).to.have.been.calledWithExactly(null, [
                sinon.match({$id: 'this_is_an_entryId_3'})
            ]);
        });
    });

    describe('#insert', function() {

        var insertEntries;
        var listColumns;

        beforeEach(function() {
            insertEntries = sinon
                .stub(restClient, 'insertEntries')
                .yields(null);

            listColumns = sinon.stub(workSheet, 'listColumns')
                .yields(null, [{cell: 'field1'}, {cell: 'field2'}]);
        });

        afterEach(function() {
            insertEntries.restore();

            if (listColumns) {
                listColumns.restore();
            }
        });

        it('call insertEntries with proper args', function() {
            // arrange
            var entry = {field1: 3, field2: 10};

            // act
            workSheet.insert(entry, testUtil.identFunc);

            // assert
            expect(listColumns).to.have.been.calledOnce;
            expect(insertEntries).to.have.been.calledOnce;
            expect(insertEntries).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field2: 10}]
            );
        });

        it('should report error', function() {
            // arrange
            var err = new Error('test');
            insertEntries.yields(err);

            // act
            workSheet.insert({}, spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(err);
        });

        it('should handle null values', function() {
            // act
            workSheet.insert(null, spy);

            // assert
            expect(spy).to.have.been.called;
        });

        it('should insert columns if the sheet does not contain', function() {
            // arrange
            var entry = {field1: 3, field3: 10, field5: 20};
            var createColumns = sinon.stub(restClient, 'createColumns').yields(null);

            // act
            workSheet.insert(entry, testUtil.identFunc);

            // assert
            expect(listColumns).to.have.been.calledTwice;
            expect(insertEntries).to.have.been.calledOnce;

            expect(insertEntries).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field3: 10, field5: 20}]
            );

            expect(createColumns).to.have.been.calledWith(
                {sheetId: 'test'}, ['field3', 'field5']
            );

            createColumns.restore();
        });
    });

    describe('#update', function() {

        var updateEntries;
        var find;

        beforeEach(function() {
            updateEntries = sinon
                .stub(restClient, 'updateEntries')
                .yields(null);

            find = sinon.stub(workSheet, 'find')
                .yields(null, restClient.getApi().queryResponse(sampleQueryResponse));
        });

        afterEach(function() {
            updateEntries.restore();
            find.restore();
        });

        it('call updateEntries with proper args', function() {
            // act
            workSheet.update({}, {}, testUtil.identFunc);

            // assert
            expect(updateEntries).to.have.been.calledOnce;
            expect(updateEntries).to.have.been.calledWith(
                {sheetId: 'test'}, {}
            );
        });

        it('should report error', function() {
            // arrange
            var err = new Error('test');
            updateEntries.yields(err);

            // act
            workSheet.update(null, null, spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(err);
        });

        it('should update only single entity by default', function() {
            // act
            workSheet.update(null, null, testUtil.identFunc);

            // assert
            expect(updateEntries).to.have.been.calledOnce;
            expect(find).to.have.been.calledWith(
                null, sinon.match({limit: 1})
            );
        });

        it('should have the ability to update multiple entities', function() {
            // act
            workSheet.update(null, null, {multiple: true}, testUtil.identFunc);

            // assert
            expect(updateEntries).to.have.been.calledOnce;
            expect(find).to.have.been.calledWith(
                null, sinon.match({limit: Number.MAX_VALUE})
            );
        });

        it('should insert value if not exists and upsert option is set', function() {
            // arrange
            var entry = {field1: 1};

            var insertEntries = sinon.stub(restClient, 'insertEntries');
            find.yields(null, []);

            // act
            workSheet.update(null, entry, {upsert: true}, testUtil.identFunc);

            // assert
            expect(updateEntries).to.not.have.been.called;
            expect(insertEntries).to.have.been.calledWith(
                {sheetId: 'test'}, entry
            );

            insertEntries.restore();
        });

        it('should do NOT insert value if not exists and upsert option is NOT set', function() {
            // arrange
            var entry = {field1: 1};

            var insertEntries = sinon.stub(restClient, 'insertEntries');
            find.yields(null, []);

            // act
            workSheet.update(null, entry, testUtil.identFunc);

            // assert
            expect(updateEntries).to.not.have.been.called;
            expect(insertEntries).to.not.have.been.called;

            insertEntries.restore();
        });
    });

    describe('#delete', function() {

        var deleteEntries;
        var queryWorksheet;

        beforeEach(function() {
            deleteEntries = sinon
                .stub(restClient, 'deleteEntries')
                .yields(null);

            queryWorksheet = sinon.stub(restClient, 'queryWorksheet')
                .yields(null, restClient.getApi().queryResponse(sampleQueryResponse));
        });

        afterEach(function() {
            deleteEntries.restore();
            queryWorksheet.restore();
        });

        it('call deleteEntries with proper args', function() {
            // arrange
            var selector = {field1: 1};

            // act
            workSheet.delete(selector, testUtil.identFunc);

            // assert
            expect(deleteEntries).to.have.been.calledOnce;
            expect(deleteEntries).to.have.been.calledWith(
                {sheetId: 'test'}, ['this_is_an_entryId_1']
            );
        });

        it('should report error', function() {
            // arrange
            var err = new Error('test');
            deleteEntries.yields(err);

            // act
            workSheet.delete(spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(err);
        });

        it('should directly call deleteEntry without find if selector contains only $id (performance...)', function() {
            // arrange
            var selector = {$id: 'test'};
            var find = sinon.stub(workSheet, 'find');

            // act
            workSheet.delete(selector, testUtil.identFunc);

            // assert
            expect(deleteEntries).to.have.been.calledOnce;
            expect(find).to.not.have.been.called;
            expect(deleteEntries).to.have.been.calledWith(
                {sheetId: 'test'}, 'test'
            );
        });
    });

    describe('#createColumns', function() {

        var createColumns;
        var queryFields;

        beforeEach(function() {
            createColumns = sinon.stub(restClient, 'createColumns');
            createColumns.yields(null);

            queryFields = sinon.stub(restClient, 'queryFields');
            queryFields.yields(null, [{cell: 'field1'}, {cell: 'field2'}]);
        });

        afterEach(function() {
            createColumns.restore();
            queryFields.restore();
        });

        it('should get column list every time to check existing columns', function() {
            // arrange
            var fields = ['field3', 'field4'];

            // act
            workSheet.createColumns(fields, testUtil.identFunc);

            // assert
            expect(createColumns).to.have.been.calledOnce;
            expect(queryFields).to.have.been.calledOnce;
            expect(createColumns).to.have.been.calledWith(
                {sheetId: 'test'}, fields, 2
            );
        });

        it('should create new columns only', function() {
            // arrange
            var fields = ['field2', 'field3'];

            // act
            workSheet.createColumns(fields, testUtil.identFunc);

            // assert
            expect(createColumns).to.have.been.calledOnce;
            expect(createColumns).to.have.been.calledWith(
                {sheetId: 'test'}, ['field3'], 2
            );
        });

        it('should report error', function() {
            // arrange
            var err = new Error('test');
            createColumns.yields(err);

            // act
            workSheet.createColumns(['field1'], spy);

            // assert
            expect(spy).to.have.been.calledWithExactly(err);
        });
    });
});
