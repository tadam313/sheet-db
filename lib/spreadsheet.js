'use strict';

var Worksheet      = require('./worksheet');
var util           = require('./util');

/**
 * SheetDb constructor. Initialize new object and set properties.
 *
 * @param {string} sheetId ID of the spreadsheet
 * @param {object} restClient Google Spreadsheet API client
 * @param {object} options to set additional connection options
 * @constructor
 */
var Spreadsheet = function(sheetId, restClient, options) {
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
            value: restClient
        }
    });
};

/**
 * Queries the information about the sheet,
 *
 * @param {function} callback queries the sheet info
 */
Spreadsheet.prototype.info = function(callback) {
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

        if (!_this.api.isAuthenticated()) {
            throw new Error('This operation requires authentication');
        }

        if (_this.workSheets) {
            var res = _this.workSheets
                .filter(function(ws) { return ws.title === title; });

            if (res.length > 0) {
                return _this.worksheet(title, callback);
            }
        }

        options = options || {};
        options.title = title;

        _this.api.createWorksheet(_this.sheetId, options, function(err) {

            if (err) {
                return callback(err);
            }

            _this.workSheets = null;
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

    if (!_this.api.isAuthenticated()) {
        throw new Error('This operation requires authentication');
    }

    this.worksheet(title, function(err, worksheet) {

        if (err) {
            return callback(err);
        }

        _this.workSheets = null;
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
function worksheetInitializer(title) {
    var sheets = this.workSheets.filter(function(item) {
        return item.title === title;
    });

    if (!sheets.length) {
        throw new Error('Sheet does not exist');
    }

    return new Worksheet(this.sheetId, sheets[0], this.api);
}

/**
 * Retrieves the specific worksheet instance. If info was called previously it returns immediatelly
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
        worksheet = worksheetInitializer.call(_this, title);

        if (typeof callback === 'function') {
            callback(null, worksheet);
        }

        return worksheet;
    }

    if (!callback) {
        throw new Error('Callback is required');
    }

    // only when someone use this module directly without proper initialization
    _this.info(function(err) {
        if (err) {
            return callback(err);
        }

        try {
            worksheet = worksheetInitializer.call(_this, title);
        } catch (err) {
            return callback(err);
        }

        callback(null, worksheet);
    });

    return null;
};

/**
 * Change the access token for the sheet
 *
 * @param {string} token Valid access token
 */
Spreadsheet.prototype.changeAccessToken = function(token) {
    if (!token) {
        throw new Error('Token should be a valid string!');
    }

    this.api.setAccessToken(token);
};

module.exports = Spreadsheet;