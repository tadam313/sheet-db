'use strict';

var queryParser   = require('./query_parser');
var dataUtil      = require('./data_util');
var sift          = require('sift');
var util          = require('util');

/**
 * Represent one worksheet of the specific spreadsheet
 *
 * @param sheetId
 * @param worksheetInfo
 * @param api
 * @constructor
 */
var Worksheet = function(sheetId, worksheetInfo, api) {
    this.worksheetInfo = worksheetInfo;
    this.worksheetInfo.sheetId = sheetId;
    this.api = api;
};

/**
 * Contains information about the worksheet itself
 *
 * @type {*}
 */
Object.defineProperty(Worksheet.prototype, 'worksheetInfo', {
    enumerable: false,
    writable: true
});

/**
 * Executes the given query on the worksheet
 *
 * @param query
 * @param options
 * @param callback
 */
Worksheet.prototype.find = function(query, options, callback) {

    if (util.isFunction(query)) {
        options = null;
        callback = query;
        query = {};
    } else if (util.isFunction(options)) {
        callback = options;
        options = null;
    }

    var sq = queryParser.parse(query);

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
};

/**
 * Executes the given query on the worksheet and returns the first result
 *
 * @param query
 * @param options
 * @param callback
 */
Worksheet.prototype.findOne = function(query, options, callback) {
    options = options || {};
    options.limit = 1;
    options.skip = 0;

    this.find(query, options, callback);
};

/**
 * Insert an entry to the worksheet
 *
 * @param entries
 * @param callback
 */
Worksheet.prototype.insert = function(entries, callback) {
    var _this = this;

    if (!util.isArray(entries)) {
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

        var missingKeys = dataUtil.arrayDiff(
            dataUtil.getArrayFields(entries),
            columns.map(function(column) { return column['cell']; })
        );

        if (!missingKeys.length) {
            return createFunction();
        }

        _this.createColumns(missingKeys, createFunction);
    });
};

/**
 * Deletes one entry from the sheet
 *
 * @param selector
 * @param callback
 */
Worksheet.prototype.delete = function(selector, callback) {
    var _this = this;

    if (selector['$id'] && util.isString(selector['$id'])) {
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
};

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
