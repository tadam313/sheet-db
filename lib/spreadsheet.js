'use strict';

var clientFactory  = require('./rest_client');
var Worksheet      = require('./worksheet');
var util           = require('./util');

/**
 * SheetDb constructor. Initialize new object and set properties.
 *
 * @param {string} sheetId ID of the spreadsheet
 * @param {object} options to set additional connection options
 * @constructor
 */
var Spreadsheet = function(sheetId, options) {
    options = options || {};

    Object.defineProperties(this, {
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

    if (options.token) {
        this.setAccessToken(options.token);
    }
};

/**
 * Queries the information about the sheet,
 *
 * @param {function} callback queries the sheet info
 */
Spreadsheet.prototype.sheetInfo = function(callback) {
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
 * @param {string} accessToken Token to access sheet
 */
Spreadsheet.prototype.setAccessToken = function(accessToken) {
    this.authenticated = accessToken != false;
    this.api.setAccessToken(accessToken);
};

/**
 * Creates worksheet with specific title.
 *
 * @param {string} title Name of the worksheet
 * @param {object} options Optional options
 * @param {function} callback
 */
Spreadsheet.prototype.createWorksheet = util.variations(
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
 * Drops the specific worksheet
 *
 * @param {string} title Name of the worksheet.
 * @param {function} callback
 */
Spreadsheet.prototype.dropWorksheet = function(title, callback) {
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
 * Creates worksheet based on the specified title.
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

    return new Worksheet(this.sheetId, sheets[0], this.api);
}

/**
 * Retrieves the specific worksheet instance. If sheetInfo was called previously it returns immediatelly
 * with the specific instance (also with callback), but if it's not the case it returns null and returns worksheet
 * with callback.
 *
 * @param {string} title Title of the worksheet
 * @param {function} callback
 * @returns {Worksheet}
 */
Spreadsheet.prototype.worksheet = function(title, callback) {
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

module.exports = Spreadsheet;
