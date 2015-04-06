
var api             = require('./spreadsheet_api');
var queryParser     = require('./query_parser');

/**
 * Represent one worksheet of the specific spreadsheet
 *
 * @param sheetId
 * @param worksheetId
 * @constructor
 */
var Worksheet = function(sheetId, worksheetId) {
    this.worksheetId = {
        sheetId: sheetId,
        worksheetId: worksheetId
    };
};

/**
 * Identifies the worksheet
 *
 * @type {sheetId, worksheetId}
 */
Worksheet.prototype.worksheetId = null;

/**
 * Executes the given query on the worksheet
 *
 * @param query
 * @param callback
 */
Worksheet.prototype.find = function(query, callback) {
    query = queryParser.parse(query);

    api.queryWorksheet(this.worksheetId, query, callback);
};

/**
 * Executes the given query on the worksheet and returns the first result
 *
 * @param query
 * @param callback
 */
Worksheet.prototype.findOne = function(query, callback) {
    this.find(query, function (err, data) {
        if (err) {
            return callback(err, null);
        }

        callback(null, data && data.length > 0 ? data[0]: null);
    });
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
