'use strict';

var queryHelper = require('./query');
var util  = require('./util');
var sift  = require('sift');

/**
 * Represent one worksheet of the specific spreadsheet. This constructor function initializes the worksheet.
 *
 * @param {string} sheetId ID of the spreadsheet
 * @param {object} worksheetInfo
 * @param {object} api Client module of the spreadsheet
 * @constructor
 */
var Worksheet = function(sheetId, worksheetInfo, api) {
    worksheetInfo = worksheetInfo || {};
    worksheetInfo.sheetId = sheetId;

    Object.defineProperties(this, {
        worksheetInfo: {
            writable: false,
            value: worksheetInfo
        },
        api: {
            enumerable: false,
            writable: false,
            value: api
        }
    });
};

/**
 * Executes the given query on the worksheet.
 *
 * @param {object} query Optional filter descriptor. The supported operators will run on server side
 * @param {object} options Optional options of the query
 * @param {function} callback
 */
Worksheet.prototype.find = util.variations(
    [['callback'], ['query', 'callback']],
    function(query, options, callback) {

        var sq = queryHelper.stringify(query);

        this.api.queryWorksheet(this.worksheetInfo, sq, options, function(err, response) {
            if (err) {
                return callback(err);
            }

            if (options) {
                var skip = Math.max(options.skip || 0, 0);
                var limit = Math.max(options.limit || Number.MAX_VALUE, 0);
                var picked = 0;

                response = response.filter(function(item, index) {
                    if (index < skip) {
                        return false;
                    }

                    return limit === Number.MAX_VALUE || ++picked <= limit;
                });
            }

            callback(null, sift(query || {}, response));
        });
    });

/**
 * Insert an entry/entries to the worksheet.
 *
 * @param {array|object} entries Single or multiple objects to insert into the sheet
 * @param {function} callback
 */
Worksheet.prototype.insert = function(entries, callback) {
    var _this = this;

    if (!entries) {
        return callback();
    }

    if (!(entries instanceof Array)) {
        entries = [entries];
    }

    var createFunction = function(err) {
        if (err) {
            return callback(err);
        }

        _this.api.insertEntries(_this.worksheetInfo, entries, callback);
    };

    listColumns.call(_this, function(err, columns) {
        if (err) {
            return callback(err);
        }

        createColumns.call(_this,
            util.getArrayFields(entries),
            columns,
            createFunction);
    });
};

/**
 * Update entry/entries in the spreadsheet.
 *
 * @param {object} selector Selects entries in the spreadsheet (valid filter descriptor)
 * @param {object} update Update description or valid object to replace the original
 * @param {object} options Optional update options
 * @param {function} callback
 */
Worksheet.prototype.update = util.variations(
    [['selector', 'update', 'callback']],
    function(selector, update, options, callback) {
        var _this = this;
        options = options || {};

        var findOptions = {limit: options.multiple ? Number.MAX_VALUE : 1};

        _this.find(selector, findOptions, function(err, entries) {

            if (err) {
                return callback(err);
            }

            // we upsert it if there is no element matching the selector
            if (!entries.length) {
                if (options.upsert) {
                    return _this.api.insertEntries(_this.worksheetInfo, update, callback);
                }

                return callback();
            }

            entries = queryHelper.updateObject(entries, update);
            _this.api.updateEntries(_this.worksheetInfo, entries, callback);
        });
    });

/**
 * Deletes entry/entries from the sheet.
 *
 * @param {object} selector Select the entries to delete (valid filter descriptor).
 * @param {object} options Optional remove options.
 * @param {function} callback
 */
Worksheet.prototype.remove = util.variations([
    ['callback'],
    ['selector', 'callback']
], function(selector, options, callback) {
    selector = selector || {};
    options = options || {};

    var _this = this;
    var findOptions = {limit: options.justOne ? 1 : Number.MAX_VALUE};

    if (queryHelper.isSingleObjectSelector(selector)) {
        _this.api.deleteEntries(_this.worksheetInfo, selector['$id'], callback);
    } else {
        _this.find(selector, findOptions, function(err, data) {
            if (err) {
                return callback(err);
            }

            _this.api.deleteEntries(
                _this.worksheetInfo,
                data.map(function(item) { return item['$id']; }),
                callback
            );
        });
    }
});

/**
 * Lists the existing columns in the sheet. Internal use only.
 *
 * @param {function} callback
 */
function listColumns(callback) {
    this.api.queryFields(this.worksheetInfo, callback);
}

/**
 * Calculates diff of the array and invoked the column creation logic. Internal use only
 *
 * @param {array} newColumns Array of field names
 * @param {array} actualColumns Actual columns in the worksheet
 * @param {function} callback
 */
function createColumns(newColumns, actualColumns, callback) {

    newColumns = util.arrayDiff(
        newColumns,
        actualColumns.map(function(item) { return item['cell']; })
    );

    this.api.createColumns(this.worksheetInfo, newColumns, actualColumns.length, callback);
}

module.exports = Worksheet;
