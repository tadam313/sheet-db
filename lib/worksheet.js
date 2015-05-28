"use strict";

var api           = require('./spreadsheet_api');
var queryParser   = require('./query_parser');
var data_util     = require('./data_util');
var sift          = require('sift');
var util          = require('util');

/**
 * Represent one worksheet of the specific spreadsheet
 *
 * @param sheetId
 * @param worksheetInfo
 * @constructor
 */
var Worksheet = function(sheetId, worksheetInfo) {
    this.worksheetInfo = worksheetInfo;
    this.worksheetInfo.sheetId = sheetId;
};

/**
 * Contains information about the worksheet itself
 *
 * @type {*}
 */
Worksheet.prototype.worksheetInfo = null;

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

    api.queryWorksheet(this.worksheetInfo, sq, options, function(err, response) {
        if (err) {
            return callback(err, null);
        }

        if (options) {
            var skip = Math.max(options.skip || 0, 0),
                limit = Math.max(options.limit || Number.MAX_VALUE, 0),
                picked = 0;

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

        api.insertEntries(_this.worksheetInfo, entries, callback);
    };

    this.listColumns(function(err, columns) {
        if (err) {
            return callback(err);
        }

        var missingKeys = data_util.arrayDiff(
            data_util.getArrayFields(entries),
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
 * @param query
 * @param callback
 */
Worksheet.prototype.delete = function(query, callback) {
    var _this = this;

    if (query['$id'] && util.isString(query['$id'])) {
        // plain simple delete fow now
        api.deleteEntries(_this.worksheetInfo, [ query['$id'] ], callback);
    } else {
        this.find(query, function(err, data) {
            if (err)
                return callback(err, null);

            if (!data) {
                return callback(new Error('Data does not exist'), null);
            }

            api.deleteEntries(
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
    api.queryFields(this.worksheetInfo, callback);
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

        api.createColumns(fields, _this.worksheetInfo, result.length, callback);
    });
};

module.exports = Worksheet;
