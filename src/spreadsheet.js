'use strict';

var Worksheet      = require('./worksheet');
var util           = require('./util');


class Spreadsheet {

    /**
     * SheetDb constructor. Initialize new object and set properties.
     *
     * @param {string} sheetId ID of the spreadsheet
     * @param {object} restClient Google Spreadsheet API client
     * @param {object} options to set additional connection options
     * @constructor
     */
    constructor(sheetId, restClient, options) {
        this.sheetId = sheetId;
        this.api = restClient;
        this.options = options;

        this.workSheets = null;
    }

    /**
     * Queries the information about the sheet.
     */
    async info() {
        let sheetInfo = await this.api.querySheetInfo(this.sheetId);

        // save the worksheets
        this.workSheets = sheetInfo.workSheets;

        return sheetInfo;
    }

    /**
     * Creates worksheet with specific title.
     *
     * @param {string} title Name of the worksheet
     * @param {object} options Optional options
     */
    async createWorksheet(title, options) {

        if (!this.api.isAuthenticated()) {
            throw new Error('This operation requires authentication');
        }

        if (this.workSheets) {
            var res = this.workSheets.filter(ws => ws.title === title);

            if (res.length > 0) {
                return this.worksheet(title, callback);
            }
        }

        options = options || {};
        options.title = title;

        return await this.api.createWorksheet(this.sheetId, options);
    }

    /**
     * Drops the specific worksheet
     *
     * @param {string} title Name of the worksheet.
     */
    async dropWorksheet(title) {

        if (!this.api.isAuthenticated()) {
            throw new Error('This operation requires authentication');
        }

        let worksheet = this.worksheet(title);

        return await this.api.dropWorksheet(
            this.sheetId, 
            worksheet.worksheetInfo.worksheetId
        );
    }

    /**
     * Retrieves the specific worksheet instance. If info was called previously it returns immediatelly
     * with the specific instance (also with callback), but if it's not the case it returns null and returns worksheet
     * with callback.
     *
     * @param {string} title Title of the worksheet
     * @returns {Worksheet}
     */
    worksheet(title) {
        var sheets = this.workSheets.filter(item => item.title === title);

        if (!sheets.length) {
            throw new Error('Sheet does not exist');
        }

        return new Worksheet(this.sheetId, sheets[0], this.api);
    }

    /**
     * Change the access token for the sheet
     *
     * @param {string} token Valid access token
     */
    changeAccessToken(token) {
        if (!token) {
            throw new Error('Token should be a valid string!');
        }

        this.api.setAccessToken(token);
    }
}

module.exports = Spreadsheet;
