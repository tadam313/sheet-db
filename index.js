var Spreadsheet = require('./lib/spreadsheet');
var clientFactory = require('./lib/rest_client');
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

    var restClient = clientFactory(options.token, options.version);

    var sheetDb = new Spreadsheet(sheetId, restClient, options);

    sheetDb.sheetInfo(function(err) {
        if (err) {
            return callback(err);
        }

        callback(null, sheetDb);
    });
}

module.exports = util.variations([
        ['sheetId', 'callback'],
        ['sheetId', 'token', 'callback']
    ], connect);
