'use strict';

var clientFactory  = require('./rest_client');
var WorkSheet       = require('./worksheet');

var SheetDb = function() {

};

Object.defineProperties(SheetDb.prototype, {
    sheetId: {
        writable: true
    },

    workSheets: {
        writable: true
    }
});

/**
 * Connects to the specific worksheet and queries the information
 *
 * @param sheetId
 * @param callback
 */
SheetDb.prototype.connect = function(sheetId, callback) {
    var self = this;

    var options = {};
    options.version = options.version || 'v3';

    this.sheetId = sheetId;
    this.api = clientFactory(options.version, options.token);

    this.api.querySheetInfo(this.sheetId, function(err, sheetInfo) {
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
SheetDb.prototype.setAccessToken = function(accessToken) {
    this.authenticated = accessToken != false;
    this.api.setAccessToken(accessToken);
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
    this.api.createWorksheet(this.sheetId, options, callback);
};

/**
 *
 *
 * @param title
 * @param callback
 */
SheetDb.prototype.dropWorksheet = function(title, callback) {
    var worksheetId = this.worksheetInfo(title);

    this.api.dropWorksheet(this.sheetId, worksheetId, callback);
};

/**
 * Lists the worksheets in the specific sheets.
 *
 * @returns {exports.sheetInfoResponse.workSheets|*}
 */
SheetDb.prototype.listWorksheets = function() {
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
SheetDb.prototype.worksheetInfo = function(title) {
    if (!this.workSheets) {
        throw new Error('Worksheet does not exist');
    }

    var sheets = this.workSheets.filter(function(item) {
        return item.title === title;
    });

    if (!sheets || !sheets.length) {
        throw new Error('Sheet does not exist');
    }

    return sheets[0];
};

/**
 * Gets the specific worksheet instance
 *
 *
 * @param title
 * @returns {WorkSheet}
 */
SheetDb.prototype.worksheet = function(title) {
    var info = this.worksheetInfo(title);

    return new WorkSheet(
        this.sheetId, info, this.api
    );
};

module.exports = SheetDb;
