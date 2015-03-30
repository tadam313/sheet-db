"use strict";

var api             = require('./spreadsheet_api'),
    WorkSheet       = require('./worksheet');

var SheetDb = function (options) {

};

/**
 * Id of the current sheet
 *
 * @type String
 */
SheetDb.prototype.sheetId = null;

/**
 * WorkSheets of the underlying sheet
 *
 * @type Array
 */
SheetDb.prototype.workSheets = null;

/**
 * Connects to the specific worksheet and queries the information
 *
 * @param sheetId
 * @param callback
 */
SheetDb.prototype.connect = function(sheetId, callback) {
    var self = this;
    this.sheetId = sheetId;

    api.querySheetInfo(this.sheetId, function (err, sheetInfo) {
        if (err) {
            return callback(err);
        }

        // save the worksheets
        self.workSheets = sheetInfo.workSheets;

        callback(err, sheetInfo);
    });
};

/**
 * Sets the access token to Google Spreadshets.
 *
 * @param accessToken
 */
SheetDb.prototype.setAccesToken = function(accessToken) {
    this.authenticated = accessToken != false;
    api.setAccessToken(accessToken);
};

/**
 * Creates worksheet.
 *
 * @param title
 * @param options
 * @param callback
 */
SheetDb.prototype.createWorksheet = function(title, options, callback) {
    if (!this.authenticated) {
        throw new Error('This operation requires authentication');
    }

    options.title = title;
    api.createWorksheet(this.sheetId, options, callback);
};

/**
 *
 *
 * @param title
 * @param callback
 */
SheetDb.prototype.dropWorksheet = function(title, callback) {
    var worksheetId = this.worksheetIdFromTitle(title);

    api.dropWorksheet(this.sheetId, worksheetId, callback);
};

/**
 * Lists the worksheets in the specific sheets.
 *
 * @returns {exports.sheetInfoResponse.workSheets|*}
 */
SheetDb.prototype.listWorkSheets = function() {
    if (!this.workSheets) {
        throw new Error('You have to connect first');
    }

    return this.workSheets;
};

/**
 * Gets the worksheet id from the title
 *
 *
 * @param title
 * @returns {internals.credentials.dh37fgj492je.id|*|credentials.id|result.id|artifacts.id|bewit.id}
 */
SheetDb.prototype.worksheetIdFromTitle = function(title) {
    var sheets = this.workSheets.filter(function (item) {
        return item.title === title;
    });

    if (!sheets || sheets.length === 0) {
        throw new Error('Invalid sheet name');
    }

    return sheets[0].id;
};

/**
 * Gets the specific worksheet instance
 *
 *
 * @param title
 * @returns {WorkSheet}
 */
SheetDb.prototype.workSheet = function(title) {
    var id = this.worksheetIdFromTitle(title);

    return new WorkSheet(this.sheetId, id);
};

module.exports = SheetDb;
