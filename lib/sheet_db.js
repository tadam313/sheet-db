"use strict";

var api         = require('./spreadsheet_api'),
    converter   = require('./model-converter');

var SheetDb = function (options) {

    this.setAccesToken(options.accessToken);
};

SheetDb.prototype = {

    connect: function (sheetId, callback) {
        this.sheetId = sheetId;

        api.querySheetInfo(sheetId, function (err, response) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, converter.fromSheetInfo(response));
        });
    },

    setAccesToken: function (accessToken) {
        this.authenticated = accessToken != false;

        api.setAccessToken(accessToken);
    },

    listWorkSheets: function () {

    },

    workSheet: function () {

    }
};

module.exports = SheetDb;