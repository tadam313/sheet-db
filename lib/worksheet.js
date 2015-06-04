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
                return callback(err, null);
            }

            if (options) {
                var skip = Math.max(options.skip || 0, 0);
                var limit = Math.max(options.limit || Number.MAX_VALUE, 0);
                var picked = 0;

                response = response.filter(function(item, index) {
                    if (index < skip) {
                        return false;
                    }

                    return ++picked <= limit;
                });
            }

            callback(null, sift(query || {}, response));
        });
    });

/**
 * Executes the given query on the worksheet and returns the first result
 *
 * @param {object} query Optional filter descriptor. The supported operators will run on server side

 * @param callback
 */
Worksheet.prototype.findOne = util.variations(
    [['callback']],
    function(query, callback) {
        var options = {
            limit: 1,
            skip: 0
        };

        this.find(query, options, callback);
    });

/**
 * Insert an entry/entries to the worksheet.
 *
 * @param {array|object} entries Single or multiple objects to insert into the sheet
 * @param {function} callback
 */
Worksheet.prototype.insert = function(entries, callback) {
    var _this = this;

    if (!(entries instanceof Array)) {
        entries = [entries];
    }

    var createFunction = function(err) {
        if (err) {
            return callback(err);
        }

        _this.api.insertEntries(_this.worksheetInfo, entries, callback);
    };

    this.listColumns(function(err, columns) {
        if (err) {
            return callback(err);
        }

        var missingKeys = util.arrayDiff(
            util.getArrayFields(entries),
            columns.map(function(column) { return column['cell']; })
        );

        if (!missingKeys.length) {
            return createFunction();
        }

        _this.createColumns(missingKeys, createFunction);
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

        var findOptions = {};

        if (!options.multiple) {
            findOptions.limit = 1;
        }

        _this.find(selector, findOptions, function(err, entries) {

            if (err) {
                return callback(err);
            }

            entries = queryHelper.transformObject(entries, update);
            _this.api.updateEntries(_this.worksheetInfo, entries, callback);
        });
    });

/**
 * Deletes entry/entries from the sheet.
 *
 * @param {object} selector Select the entries to delete (valid filter descriptor).
 * @param {function} callback
 */
Worksheet.prototype.delete = util.variations(
    [['callback']],
    function(selector, callback) {
        var _this = this;
        selector = selector || {};

        if (selector['$id'] && typeof selector['$id'] === 'string') {
            this.api.deleteEntries(_this.worksheetInfo, [selector['$id']], callback);
        } else {
            this.find(selector, function(err, data) {
                if (err) {
                    return callback(err, null);
                }

                if (!data) {
                    return callback(new Error('Data does not exist'), null);
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
 * Lists the existing columns in the sheet.
 *
 * @param {function} callback
 */
Worksheet.prototype.listColumns = function(callback) {
    this.api.queryFields(this.worksheetInfo, callback);
};

/**
 * Creates additional columns in the sheet.
 *
 * @param {array} fields Field names to include
 * @param {function} callback
 */
Worksheet.prototype.createColumns = function(fields, callback) {
    var _this = this;

    this.listColumns(function(err, result) {
        if (err) {
            return callback(err);
        }

        _this.api.createColumns(fields, _this.worksheetInfo, result.length, callback);
    });
};

module.exports = Worksheet;
