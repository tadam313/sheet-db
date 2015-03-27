"use strict";

var api         = require('./spreadsheet_api'),
    converter   = require('./model-converter'),
    WorkSheet   = require('./worksheet');

var SheetDb = function (options) {

    if (options) {
        this.setAccesToken(options.accessToken);
    }
};

SheetDb.prototype = {

    connect: function (sheetId, callback) {
        var self = this;
        this.sheetId = sheetId;

        api.querySheetInfo(this.sheetId, function (err, response) {
            var sheetInfo = converter.fromSheetInfo(response);

            // save the worksheets
            self.workSheets = sheetInfo.workSheets;

            callback(err, sheetInfo);
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
        if (!this.workSheets) {
            throw new Error('You have to connect first');
        }

        return this.workSheets;
    },

    workSheet: function () {
        return new WorkSheet();
    }
};

module.exports = SheetDb;
