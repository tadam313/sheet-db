'use strict';

var queryHelper = require('./query');
var util  = require('./util');
var sift  = require('sift');

class Worksheet {

    /**
     * Represent one worksheet of the specific spreadsheet. This constructor function initializes the worksheet.
     * @constructor
     * @param {string} sheetId -  ID of the spreadsheet
     * @param {object} worksheetInfo - ...
     * @param {object} api  - Client module of the spreadsheet
     * @constructor
     */
    constructor(sheetId, worksheetInfo, api) {
        this.worksheetInfo = worksheetInfo || {};
        this.api = api;

        this.worksheetInfo.sheetId = sheetId;
    }

    /**
     * Executes the given query on the worksheet.
     *
     * @param {object} query Optional filter descriptor. The supported operators will run on server side
     * @param {object} options Optional options of the query
     * @param {function} callback
     */
    find(query, options, callback) {
        var sq = queryHelper.stringify(query);

        if (!options && !callback) {
            callback = query;
            options = query = {};
        } else if (!callback) {
            callback = options;
            options = {};
        }

        options = options || {};

        this.api.queryWorksheet(this.worksheetInfo, sq, options, (err, response) => {
            if (err) {
                return callback(err);
            }

            if (options) {
                let skip = Math.max(options.skip || 0, 0);
                let limit = Math.max(options.limit || Number.MAX_VALUE, 0);
                let picked = 0;

                response = response.filter(
                    (item, index) => index >= skip && ++picked <= limit
                );
            }

            callback(null, sift(query || {}, response));
        });
    }

    /**
     * Insert an entry/entries to the worksheet.
     *
     * @param {array|object} entries Single or multiple objects to insert into the sheet
     * @param {function} callback
     */
    insert(entries, callback) {
        var _this = this;

        if (!entries) {
            return callback();
        }

        if (!(entries instanceof Array)) {
            entries = [entries];
        }

        var createFunction = (err) => {
            if (err) {
                return callback(err);
            }

            _this.api.insertEntries(_this.worksheetInfo, entries, callback);
        };

        _this._listColumns((err, columns) => {
            if (err) {
                return callback(err);
            }

            _this._createColumns(
                util.getArrayFields(entries),
                columns,
                createFunction
            );
        });
    }


    /**
     * Update entry/entries in the spreadsheet.
     *
     * @param {object} selector Selects entries in the spreadsheet (valid filter descriptor)
     * @param {object} update Update description or valid object to replace the original
     * @param {object} options Optional update options
     * @param {function} callback
     */
    update(selector, update, options, callback) {
        var _this = this;
        options = options || {};
        callback = typeof options == 'function' ? options : callback;

        var findOptions = {limit: options.multiple ? Number.MAX_VALUE : 1};

        _this.find(selector, findOptions, (err, entries) => {

            if (err) {
                return callback(err);
            }

            // we upsert it if there is no element matching the selector
            if (!entries.length) {
                if (options.upsert) {
                    return _this.api.insertEntries(_this.worksheetInfo, update, callback);
                }

                return callback(null);
            }

            entries = queryHelper.updateObject(entries, update);
            _this.api.updateEntries(_this.worksheetInfo, entries, callback);
        });
    }

    /**
     * Deletes entry/entries from the sheet.
     *
     * @param {object} selector Select the entries to delete (valid filter descriptor).
     * @param {object} options Optional remove options.
     * @param {function} callback
     */
    remove(selector, options, callback) {
        if (!options && !callback) {
            callback = selector;
            options = selector = {};
        } else if (!callback) {
            callback = options;
            options = {};
        }

        selector = selector || {};
        options = options || {};

        let _this = this;
        let findOptions = {limit: options.justOne ? 1 : Number.MAX_VALUE};

        if (queryHelper.isSingleObjectSelector(selector)) {
            _this.api.deleteEntries(_this.worksheetInfo, selector['_id'], callback);
        } else {
            _this.find(selector, findOptions, (err, data) => {
                if (err) {
                    return callback(err);
                }

                _this.api.deleteEntries(
                    _this.worksheetInfo,
                    data.map(item => item['_id']),
                    callback
                );
            });
        }
    }

    /**
     * Lists the existing columns in the sheet. Internal use only.
     *
     * @param {function} callback
     */
    _listColumns(callback) {
        this.api.queryFields(this.worksheetInfo, callback);
    }

    /**
     * Calculates diff of the array and invoked the column creation logic. Internal use only
     *
     * @param {array} newColumns Array of field names
     * @param {array} actualColumns Actual columns in the worksheet
     * @param {function} callback
     */
    _createColumns(newColumns, actualColumns, callback) {
        newColumns = util.arrayDiff(
            newColumns,
            actualColumns.map(item => item['cell'])
        );

        this.api.createColumns(this.worksheetInfo, newColumns, actualColumns.length, callback);
    }
}

module.exports = Worksheet;
