"use strict";

var api             = require('./spreadsheet_api'),
    converter       = require('./model_converter'),
    WorkSheet       = require('./worksheet'),
    events          = require('events'),
    eventEmitter    = new events.EventEmitter();

var SheetDb = function (options) {

    this.events = eventEmitter;
    api.setEvents(this.events);

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

        this.events.emit('access_token_updated', accessToken);
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

    dropWorksheet: function (title, callback) {
        var worksheetId = this.worksheetIdFromTitle(title);

        api.removeWorksheet(this.sheetId, worksheetId, function (err, response) {
            callback(err, converter.fromDropWorksheet(response));
        });
    },

    renameWorksheet: function (title) {
        throw Error('Not implemented yet');
    },

    listWorkSheets: function () {
        if (!this.workSheets) {
            throw new Error('You have to connect first');
        }

        return this.workSheets;
    },

    worksheetIdFromTitle: function (title) {
        var sheets = this.workSheets.filter(function (item) {
            return item.title === title;
        });

        if (!sheets || sheets.length === 0) {
            throw new Error('Invalid sheet name');
        }

        return sheets[0].id;
    },

    workSheet: function (title) {
        var id = this.worksheetIdFromTitle(title);

        return new WorkSheet(this.sheetId, id, api);
    }
};

module.exports = SheetDb;
