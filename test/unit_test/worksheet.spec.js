'use strict';

require("babel-polyfill");

var Worksheet = require('../../lib/worksheet');
var query = require('../../lib/query');
var chai = require('chai');
var sinon = require('sinon');
var api = require('../../lib/api').getApi('v3');
require('sinon-as-promised');

var sampleQueryResponse = api.converter.queryResponse(require('./../fixtures/v3/sample_query'));
var sampleFieldQueryResponse = api.converter.queryFieldNames(require('./../fixtures/v3/sample_query_fieldnames'));

chai.use(require('sinon-chai'));
chai.use(require('chai-things'));
chai.use(require('chai-subset'));
var expect = chai.expect;

describe('Worksheet', function() {

    var worksheet, restClient;

    beforeEach(function() {
        restClient = {
            insertEntries: sinon.spy(),
            updateEntries: sinon.spy(),
            deleteEntries: sinon.spy(),
            createColumns: sinon.spy(),
            queryWorksheet: sinon.stub(),
            queryFields: sinon.stub()
        };

        restClient.queryWorksheet.resolves(sampleQueryResponse);
        restClient.queryFields.resolves(sampleFieldQueryResponse);

        worksheet = new Worksheet('test', {}, restClient);
    });

    describe('#find', function() {

        it('should list the whole worksheet if selector is empty', function*() {
            // arrange
            let selector = {};

            // act
            let result = yield worksheet.find(selector);

            // assert
            expect(restClient.queryWorksheet).to.have.been.calledOnce;
            expect(result).all.to.containSubset([
                {_id: 'this_is_an_entryId_1'},
                {_id: 'this_is_an_entryId_2'},
                {_id: 'this_is_an_entryId_3'}
            ]);
        });

        it('should limit collection', function*() {
            // arrange
            let limitation = 2;
            let options = {limit: limitation};

            // act
            let result = yield worksheet.find(null, options);

            //assert
            expect(result).to.have.lengthOf(limitation);
            expect(result).all.to.containSubset([
                {_id: 'this_is_an_entryId_1'},
                {_id: 'this_is_an_entryId_2'}
            ]);
        });

        it('should skip items', function*() {
            // arrange
            let skip = 2;
            let options = {skip: skip};

            // act
            let result = yield worksheet.find(null, options);

            //assert
            expect(result).to.have.lengthOf(3 - skip);
            expect(result).all.to.containSubset([
                {_id: 'this_is_an_entryId_3'}
            ]);
        });

        it('should filter properly also on the client side', function*() {
            // act
            let result = yield worksheet.find({field1: {$gte: 2}});

            //assert
            expect(result).all.to.containSubset([
                {_id: 'this_is_an_entryId_2'},
                {_id: 'this_is_an_entryId_3'}
            ]);
        });
    });

    describe('#insert', function() {

        it('should call the api', function*() {
            // arrange
            let entry = {field1: 3, field2: 10};
            let testOptions = {test: 1};

            // act
            yield worksheet.insert(entry, testOptions);

            // assert
            expect(restClient.queryFields).to.have.been.calledOnce;
            expect(restClient.insertEntries).to.have.been.calledOnce;
            expect(restClient.insertEntries).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field2: 10}],
                testOptions
            );
        });

        it('should insert columns if the sheet does not contain them', function*() {
            // arrange
            let entry = {field1: 3, field3: 10, field5: 20};

            // act
            yield worksheet.insert(entry);

            // assert
            expect(restClient.insertEntries).to.have.been.calledWith(
                {sheetId: 'test'},
                [{field1: 3, field3: 10, field5: 20}]
            );

            expect(restClient.createColumns).to.have.been.calledWith(
                {sheetId: 'test'}, ['field3', 'field5']
            );
        });

        it('should handle if nothing is inserted', function*() {
            yield worksheet.insert(null);

            expect(restClient.queryFields).to.not.have.been.called;
            expect(restClient.insertEntries).to.not.have.been.called;
        });
    });

    describe('#update', function() {
        var findStub;

        beforeEach(function() {
            findStub = sinon.stub(worksheet, 'find');
            findStub.resolves([]);
        });

        afterEach(function() {
            findStub.restore();
        });

        it('should call the api with an array of updatable entries', function*() {
            // arrange
            var entry = {field1: 'test'};
            findStub.resolves([{field1: 1}, {field1: 1, test: 2}]);

            // act
            yield worksheet.update({field1: 1}, entry);

            // assert
            expect(restClient.updateEntries).to.have.been.calledWith(
                {sheetId: 'test'}, [entry]
            );
        });

        it('should update only single entity by default', function*() {
            // arrange
            findStub.resolves([{}]);

            // act
            yield worksheet.update(null, null);

            // assert
            expect(restClient.updateEntries).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith(
                null, sinon.match({limit: 1})
            );
        });

        it('should have the ability to update multiple entities', function*() {
            // arrange
            findStub.resolves([{}]);

            // act
            yield worksheet.update(null, null, {multiple: true});

            // assert
            expect(restClient.updateEntries).to.have.been.calledOnce;
            expect(findStub).to.have.been.calledWith(
                null, sinon.match({limit: Number.MAX_VALUE})
            );
        });

        it('should insert value if not exists and upsert option is set', function*() {
            // arrange
            var entry = {field1: 1};

            // act
            yield worksheet.update(null, entry, {upsert: true});

            // assert
            expect(restClient.updateEntries).to.not.have.been.called;
            expect(restClient.insertEntries).to.have.been.calledWith(
                {sheetId: 'test'}, entry
            );
        });

        it('should NOT insert value if not exists and upsert option is NOT set', function*() {
            // arrange
            var entry = {field1: 1};

            // act
            yield worksheet.update(null, entry);

            // assert
            expect(restClient.updateEntries).to.not.have.been.called;
            expect(restClient.updateEntries).to.not.have.been.called;
        });
    });

    describe('#remove', function() {

        it('should call the api', function*() {
            // arrange
            var selector = {field1: 1};

            // act
            yield worksheet.remove(selector);

            // assert
            expect(restClient.deleteEntries).to.have.been.calledOnce;
            expect(restClient.deleteEntries).to.have.been.calledWith(
                {sheetId: 'test'}, ['this_is_an_entryId_1']
            );
        });

        it('should directly call deleteEntry without find if selector contains only _id (performance...)', function*() {
            // arrange
            let selector = {_id: 'test'};

            // act
            yield worksheet.remove(selector);

            // assert
            expect(restClient.deleteEntries).to.have.been.calledOnce;
            expect(restClient.queryFields).to.not.have.been.called;
            expect(restClient.deleteEntries).to.have.been.calledWith(
                {sheetId: 'test'}, 'test'
            );
        });

        it('should delete only one entity if justOne is set', function*() {
            // arrange
            let selector = {field1: {$in: [1, 2, 3]}};

            // act
            yield worksheet.remove(selector, {justOne: true});

            // assert
            expect(restClient.deleteEntries).to.have.been.calledOnce;
            expect(restClient.deleteEntries).to.have.been.calledWith(
                {sheetId: 'test'}, ['this_is_an_entryId_1']
            );
        });
    });
});
