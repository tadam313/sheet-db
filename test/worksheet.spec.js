'use strict';

require("babel-polyfill");

var Worksheet = require('../lib/worksheet');
var clientFactory = require('../lib/rest_client');
var query = require('../lib/query');
var testUtil = require('./test_util');
var chai = require('chai');
var sinon = require('sinon');
require('sinon-as-promised');

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
        queryWorksheetStub.resolves(restClient.getApi().converter.queryResponse(sampleQueryResponse));

        queryFieldsStub = sinon.stub(restClient, 'queryFields');
        queryFieldsStub.resolves(restClient.getApi().converter.queryFieldNames(sampleFieldQueryResponse));

        insertEntriesStub = sinon.stub(restClient, 'insertEntries');
        updateEntriesStub = sinon.stub(restClient, 'updateEntries');
        deleteEntriesStub = sinon.stub(restClient, 'deleteEntries');
        createColumnsStub = sinon.stub(restClient, 'createColumns');

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

        it('should list the whole worksheet if selector is empty', function*() {
            // arrange
            let selector = {};

            // act
            let result = yield worksheet.find(selector);

            // assert
            expect(queryWorksheetStub).to.have.been.calledOnce;
            expect(result).to.be([
                sinon.match({_id: 'this_is_an_entryId_1'}),
                sinon.match({_id: 'this_is_an_entryId_2'}),
                sinon.match({_id: 'this_is_an_entryId_3'})
            ]);
        });

        it('should limit collection', function*() {
            // arrange
            let options = {limit: 2};

            // act
            let result = yield worksheet.find(null, options);

            //assert
            expect(result).to.be([
                sinon.match({_id: 'this_is_an_entryId_1'}),
                sinon.match({_id: 'this_is_an_entryId_2'})
            ]);
        });

        it('should skip items', function*() {
            // arrange
            var options = {skip: 2};

            // act
            let result = yield worksheet.find(null, options);

            //assert
            expect(result).to.be([
                sinon.match({_id: 'this_is_an_entryId_3'})
            ]);
        });

        it('should filter properly also on the client side', function*() {
            // act
            let result = yield worksheet.find({field1: {$gte: 2}}, spy);

            //assert
            expect(spy).to.be([
                sinon.match({_id: 'this_is_an_entryId_2'}),
                sinon.match({_id: 'this_is_an_entryId_3'})
            ]);
        });
    });

    describe('#insert', function() {

        it('should call the api', function*() {
            // arrange
            let entry = {field1: 3, field2: 10};

            // act
            yield worksheet.insert(entry, testUtil.identFunc);

            // assert
            expect(queryFieldsStub).to.have.been.calledOnce;
            expect(insertEntriesStub).to.have.been.calledOnce;
            expect(insertEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field2: 10}]
            );
        });

        it('should handle null values', function*() {
            // act
            yield worksheet.insert(null, spy);

            // assert
            expect(spy).to.have.been.called;
        });

        it('should insert columns if the sheet does not contain them', function*() {
            // arrange
            let entry = {field1: 3, field3: 10, field5: 20};

            // act
            yield worksheet.insert(entry, testUtil.identFunc);

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
    });

    describe('#update', function() {

        it('should call the api', function*() {
            let entry = {field1: 'test'};

            // act
            yield worksheet.update({field1: 1}, entry, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.have.been.calledOnce;
            expect(updateEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, entry
            );
        });

        it('should update only single entity by default', function*() {
            // arrange
            var findStub = sinon.stub(worksheet, 'find');
            findStub.resolves([{}]);

            // act
            yield worksheet.update(null, null, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith(
                null, sinon.match({limit: 1})
            );

            findStub.restore();
        });

        it('should have the ability to update multiple entities', function*() {
            // arrange
            let findStub = sinon.stub(worksheet, 'find');
            findStub.resolves([{}]);

            // act
            yield worksheet.update(null, null, {multiple: true}, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith(
                null, sinon.match({limit: Number.MAX_VALUE})
            );

            findStub.restore();
        });

        it('should insert value if not exists and upsert option is set', function*() {
            // arrange
            let entry = {field1: 1};
            let findStub = sinon.stub(worksheet, 'find');
            findStub.resolves([]);

            // act
            yield worksheet.update(null, entry, {upsert: true}, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.not.have.been.called;
            expect(insertEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, entry
            );

            findStub.restore();
        });

        it('should NOT insert value if not exists and upsert option is NOT set', function*() {
            // arrange
            let entry = {field1: 1};
            let findStub = sinon.stub(worksheet, 'find');
            findStub.resolves(null, []);

            // act
            yield worksheet.update(null, entry, testUtil.identFunc);

            // assert
            expect(updateEntriesStub).to.not.have.been.called;
            expect(insertEntriesStub).to.not.have.been.called;
            findStub.restore();
        });
    });

    describe('#remove', function() {

        it('should call the api', function*() {
            // arrange
            let selector = {field1: 1};

            // act
            yield worksheet.remove(selector, testUtil.identFunc);

            // assert
            expect(deleteEntriesStub).to.have.been.calledOnce;
            expect(deleteEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, ['this_is_an_entryId_1']
            );
        });

        it('should directly call deleteEntry without find if selector contains only _id (performance...)', function*() {
            // arrange
            let selector = {_id: 'test'};

            // act
            yield worksheet.remove(selector, testUtil.identFunc);

            // assert
            expect(deleteEntriesStub).to.have.been.calledOnce;
            expect(queryWorksheetStub).to.not.have.been.called;
            expect(deleteEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, 'test'
            );
        });

        it('should delete only one entity if justOne is set', function*() {
            // arrange
            let selector = {field1: {$in: [1, 2, 3]}};

            // act
            yield worksheet.remove(selector, {justOne: true}, testUtil.identFunc);

            // assert
            expect(deleteEntriesStub).to.have.been.calledOnce;
            expect(deleteEntriesStub).to.have.been.calledWith(
                {sheetId: 'test'}, ['this_is_an_entryId_1']
            );
        });
    });
});
