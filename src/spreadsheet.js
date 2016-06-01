'use strict';

var Worksheet = require('./worksheet');


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
    }

    /**
     * Queries the information about the sheet.
     */
    async info() {
        return await this.api.querySheetInfo(this.sheetId);
    }

    /**
     * Creates the specific worksheet.
     *
     * @param {string} title Name of the worksheet.
     * @param {object} options Additional options for the worksheet
     */
    async createWorksheet(title, options) {
        let worksheet = await this.worksheet(title);

        if (!worksheet) {
            let worksheetInfo = await this.api.createWorksheet(this.sheetId, options);
            worksheet = new Worksheet(this.sheetId, worksheetInfo, this.api);
        }

        return worksheet;
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

        let worksheet = await this.worksheet(title, false);

        if (!worksheet) {
            return;
        }

        return await this.api.dropWorksheet(
            this.sheetId,
            worksheet.worksheetInfo.worksheetId
        );
    }

    /**
     * Retrieves worksheet instances.
     *
     * @returns {Worksheet[]}
     */
    async worksheets() {
        let sheetInfo = await this.info();
        return sheetInfo.workSheets.map(sheet => new Worksheet(this.sheetId, sheet, this.api));
    }

    /**
     * Retrieves the specific worksheet instance.
     *
     * @param {string} title Title of the worksheet
     * @returns {Worksheet}
     */
    async worksheet(title) {
        let workSheets = await this.worksheets();
        let sheets = workSheets.filter(item => item.worksheetInfo.title === title);
        let worksheet;

        if (sheets.length) {
            worksheet = sheets[0];
        }

        return worksheet;
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
