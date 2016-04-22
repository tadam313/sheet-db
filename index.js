// require necessary polyfills
require("babel-polyfill");

var Spreadsheet = require('./lib/spreadsheet');
var clientFactory = require('./lib/rest_client');

/**
 * Connects and initializes the sheet db.
 *
 * @param {string} sheetId - ID of the specific spreadsheet
 * @param {object} options - Optional options.
 */
function connect(sheetId, options) {

    options = options || {};
    options.version = 'v3';

    // TODO: needs better access token handling
    var restClient = clientFactory(options.token, options.version);
    return new Spreadsheet(sheetId, restClient, options);
}

module.exports = connect;
