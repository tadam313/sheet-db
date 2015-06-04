'use strict';

var query = require('./query_parser');
var util  = require('./util');
var sift  = require('sift');

/**
 * Represent one worksheet of the specific spreadsheet
 *
 * @param sheetId
 * @param worksheetInfo
 * @param api
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
 * Executes the given query on the worksheet
 *
 * @param query
 * @param options
 * @param callback
 */
Worksheet.prototype.find = util.variations(
    [['callback'], ['query', 'callback']],
    function(query, options, callback) {

        var sq = query.stringify(query);

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
 * @param query
 * @param options
 * @param callback
 */
Worksheet.prototype.findOne = util.variations(
    [['callback'], ['query', 'callback']],
    function(query, options, callback) {
        options = options || {};
        options.limit = 1;
        options.skip = 0;

        this.find(query, options, callback);
    });

/**
 * Insert an entry to the worksheet
 *
 * @param entries
 * @param callback
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
 *
 *
 * @param selector
 * @param update
 * @param options
 * @param callback
 */
Worksheet.prototype.update = util.variations(
    [['selector', 'document', 'callback']],
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

            entries = query.mutateObjects(entries, update);
            _this.api.updateEntries(_this.worksheetInfo, entries, callback);
        });
    });

/**
 * Deletes one entry from the sheet
 *
 * @param selector
 * @param callback
 */
Worksheet.prototype.delete = util.variations(
    [['callback']],
    function(selector, callback) {
        var _this = this;
        selector = selector || {};

        if (selector['$id'] && typeof selector['$id'] === 'string') {
            // plain simple delete fow now
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
 * Lists the existing columns in the sheet
 *
 * @param callback
 */
Worksheet.prototype.listColumns = function(callback) {
    this.api.queryFields(this.worksheetInfo, callback);
};

/**
 * Creates additional columns in the sheet
 *
 * @param fields
 * @param callback
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
