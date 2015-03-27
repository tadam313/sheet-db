"use strict";

var api         = require('./spreadsheet_api'),
    converter   = require('./model-converter');

var SheetDb = function (options) {

    if (options) {
        this.setAccesToken(options.accessToken);
    }
};

SheetDb.prototype = {

    connect: function (sheetId, callback) {
        this.sheetId = sheetId;

        api.querySheetInfo(this.sheetId, function (err, response) {
            callback(err, converter.fromSheetInfo(response));
        });
    },

    setAccesToken: function (accessToken) {
        this.authenticated = accessToken != false;

        api.setAccessToken(accessToken);
    },

    createWorksheet: function (title, options, callback) {
        if (!this.authenticated) {
            throw new Error('This operation requires authentication');
        }

        var payload = converter.toCreateWorkSheet(title, options);

        api.createWorksheet(this.sheetId, payload, function (err, response) {
            callback(err, converter.fromCreateWorkSheet(response));
        });
    },

    listWorkSheets: function () {

    },

    workSheet: function () {

    }
};

module.exports = SheetDb;
