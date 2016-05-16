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
     */
    async find(query, options) {
        options = options || {};
        query = query || {};

        let sq = queryHelper.stringify(query);
        let response = await this.api.queryWorksheet(this.worksheetInfo, sq, options);

        if (options) {
            let skip = Math.max(options.skip || 0, 0);
            let limit = Math.max(options.limit || Number.MAX_VALUE, 0);
            let picked = 0;

            response = response.filter((item, index) => index >= skip && ++picked <= limit);
        }

        return sift(query, response)
    }

    /**
     * Insert an entry/entries to the worksheet.
     *
     * @param {array|object} entries Single or multiple objects to insert into the sheet
     */
    async insert(entries) {

        if (!(entries instanceof Array)) {
            entries = [entries];
        }

        await this._createColumns(
            util.getArrayFields(entries),
            await this._listColumns()
        );

        return await this.api.insertEntries(this.worksheetInfo, entries);
    }


    /**
     * Update entry/entries in the spreadsheet.
     *
     * @param {object} selector Selects entries in the spreadsheet (valid filter descriptor)
     * @param {object} update Update description or valid object to replace the original
     * @param {object} options Optional update options
     */
    async update(selector, update, options) {
        options = options || {};
        let findOptions = {limit: options.multiple ? Number.MAX_VALUE : 1};
        let result = await this.find(selector, findOptions);

        if (result.length) {
            let entries = queryHelper.updateObject(result, update);
            return await this.api.updateEntries(this.worksheetInfo, entries);
        }

        if (options.upsert) {
            return await this.api.insertEntries(this.worksheetInfo, update);
        }
    }

    /**
     * Deletes entry/entries from the sheet.
     *
     * @param {object} selector Select the entries to delete (valid filter descriptor).
     * @param {object} options Optional remove options.
     */
    async remove(selector, options) {
        selector = selector || {};
        options = options || {};

        if (queryHelper.isSingleObjectSelector(selector)) {
            return await this.api.deleteEntries(this.worksheetInfo, selector['_id']);
        }

        let findOptions = {limit: options.justOne ? 1 : Number.MAX_VALUE};
        let result = await this.find(selector, findOptions);

        return await this.api.deleteEntries(
            this.worksheetInfo,
            result.map(item => item['_id'])
        );
    }

    /**
     * Lists the existing columns in the sheet. Internal use only.
     */
    async _listColumns() {
        return await this.api.queryFields(this.worksheetInfo);
    }

    /**
     * Calculates diff of the array and invoked the column creation logic. Internal use only
     *
     * @param {array} newColumns Array of field names
     * @param {array} actualColumns Actual columns in the worksheet
     */
    async _createColumns(newColumns, actualColumns) {
        newColumns = util.arrayDiff(
            newColumns,
            actualColumns.map(item => item['cell'])
        );

        return await this.api.createColumns(
            this.worksheetInfo,
            newColumns,
            actualColumns.length
        );
    }
}

module.exports = Worksheet;
