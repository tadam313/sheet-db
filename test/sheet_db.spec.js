'use strict';

var Spreadsheet = require('../lib/spreadsheet');
var clientFactory = require('../lib/rest_client');
var chai = require('chai');
var sinon = require('sinon');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('SheetDb', function() {

    var sheet;
    var restClient;
    var querySheetInfoStub;
    var createWorksheetStub;
    var dropWorksheetStub;

    beforeEach(function() {
        restClient = clientFactory();
        sheet = new Spreadsheet('test', {token: 'test'});

        querySheetInfoStub = sinon.stub(restClient, 'querySheetInfo');
        createWorksheetStub = sinon.stub(restClient, 'createWorksheet');
        dropWorksheetStub = sinon.stub(restClient, 'dropWorksheet');
    });

    afterEach(function() {
        querySheetInfoStub.restore();
        createWorksheetStub.restore();
        dropWorksheetStub.restore();
    });

    describe('#sheetInfo', function() {

    });

    describe('#createWorksheet', function() {

    });

    describe('#dropWorksheet', function() {

    });

    describe('#worksheet', function() {

    });
});
