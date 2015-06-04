'use strict';

var clientFactory  = require('./rest_client');
var WorkSheet      = require('./worksheet');
var util           = require('./util');

/**
 * SheetDb constructor
 *
 * @param sheetId
 * @param options
 * @constructor
 */
var SheetDb = function(sheetId, options) {

    Object.defineProperties(SheetDb.prototype, {
        sheetId: {
            writable: false,
            value: sheetId
        },
        workSheets: {
            writable: true
        },
        api: {
            enumerable: false,
            writable: false,
            value: clientFactory(options.version, options.token)
        }
    });
};

/**
 * Connects to the specific worksheet and queries the information
 *
 * @param callback
 */
SheetDb.prototype.sheetInfo = function(callback) {
    var _this = this;

    this.api.querySheetInfo(this.sheetId, function(err, sheetInfo) {
        if (err) {
            return callback(err);
        }

        // save the worksheets
        _this.workSheets = sheetInfo.workSheets;
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
SheetDb.prototype.createWorksheet = util.variations(
    [['title', 'callback']],
    function(title, options, callback) {
        var _this = this;

        if (!_this.authenticated) {
            throw new Error('This operation requires authentication');
        }

        options = options || {};
        options.title = title;

        _this.api.createWorksheet(_this.sheetId, options, function(err) {

            if (err) {
                return callback(err);
            }

            _this.worksheet(title, callback);
        });
    });

/**
 *
 *
 * @param title
 * @param callback
 */
SheetDb.prototype.dropWorksheet = function(title, callback) {
    var _this = this;

    this.worksheet(title, function(err, worksheet) {

        if (err) {
            return callback(err);
        }

        _this.api.dropWorksheet(
            _this.sheetId,
            worksheet.worksheetInfo.worksheetId,
            callback
        );
    });
};

/**
 * Creates worksheet based on the specified title
 *
 * @returns {Worksheet}
 */
function worksheetCreator(title) {
    var sheets = this.workSheets.filter(function(item) {
        return item.title === title;
    });

    if (!sheets.length) {
        throw new Error('Sheet does not exist');
    }

    return new WorkSheet(this.sheetId, sheets[0], this.api);
}

/**
 * Gets the specific worksheet instance
 *
 *
 * @param title
 * @param callback
 * @returns {WorkSheet}
 */
SheetDb.prototype.worksheet = function(title, callback) {
    var _this = this;
    var worksheet = null;

    if (_this.workSheets) {
        worksheet = worksheetCreator.call(_this, title);

        if (typeof callback === 'function') {
            callback(null, worksheet);
        }

        return worksheet;
    }

    // only when someone use this module directly without proper initialization
    _this.sheetInfo(function(err) {
        if (err) {
            return callback(err);
        }

        try {
            worksheet = worksheetCreator.call(_this, title);
        } catch (err) {
            return callback(err);
        }

        callback(null, worksheet);
    });

    return null;
};

module.exports = SheetDb;
