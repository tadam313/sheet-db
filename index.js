var Spreadsheet = require('./lib/spreadsheet');
var util = require('./lib/util');

/**
 * Connects and initializes the sheet db.
 *
 * @param {string} sheetId ID of the specific spreadsheet
 * @param {object} options Optional options.
 * @param {function} callback
 */
function connect(sheetId, options, callback) {

    options = options || {};
    options.version = 'v3';

    var sheetDb = new Spreadsheet(sheetId, options);

    sheetDb.sheetInfo(function(err) {
        if (err) {
            return callback(err);
        }

        callback(null, sheetDb);
    });
}

module.exports = {
    connect: util.variations([['sheetId', 'callback']], connect)
};
