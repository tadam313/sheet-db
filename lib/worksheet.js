"use strict";

var api           = require('./spreadsheet_api');
var queryParser   = require('./query_parser');
var sift          = require('sift');

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

                return (++picked) <= limit;
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
 * @param entry
 * @param callback
 */
Worksheet.prototype.insertOne = function(entry, callback) {
    var _this = this;

    var createFunction = function(err) {
        if (err) {
            return callback(err);
        }

        api.insertEntry(_this.worksheetInfo, entry, callback);
    };

    this.listColumns(function(err, columns) {
        if (err) {
            return callback(err);
        }

        var columnsInSheet = columns.map(function(column) { return column['cell']; });

        var missingKeys = Object.keys(entry).filter(function(key) {
            return !~columnsInSheet.indexOf(key);
        });

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
Worksheet.prototype.deleteOne = function(query, callback) {
    var _this = this;

    if (query['$id'] && typeof query['$id'] === 'string') {
        // plain simple delete fow now
        api.deleteEntry(_this.worksheetInfo, query['$id'], callback);
    } else {
        this.findOne(query, function (err, data) {
            if (err)
                return callback(err, null);

            if (!data)
                return callback(new Error('Data is not exists'), null);

            api.deleteEntry(self.worksheetId, data['$id'], callback);
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
