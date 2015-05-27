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
    this.worksheetId = {
        sheetId: sheetId,
        worksheetId: worksheetInfo.id
    };

    this.worksheetInfo = worksheetInfo;
};

/**
 * Identifies the worksheet
 *
 * @type {sheetId, worksheetId}
 */
Worksheet.prototype.worksheetId = null;

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

    api.queryWorksheet(this.worksheetId, sq, options, function(err, response) {
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
    api.insertEntry(this.worksheetId, entry, callback);
};

/**
 * Deletes one entry from the sheet
 *
 * @param query
 * @param callback
 */
Worksheet.prototype.deleteOne = function(query, callback) {
    var self = this;

    if (query['$id'] && typeof query['$id'] === 'string') {
        // plain simple delete fow now
        api.deleteEntry(self.worksheetId, query['$id'], callback);
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

module.exports = Worksheet;
