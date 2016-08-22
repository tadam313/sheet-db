// require necessary polyfills
require("babel-polyfill");

var Spreadsheet = require('./lib/spreadsheet');
var clientFactory = require('./lib/rest_client');
var apiFactory = require('./lib/api');
var cache = require('memory-cache');

/**
 * Connects and initializes the sheet db.
 *
 * @param {string} sheetId - ID of the specific spreadsheet
 * @param {object} options - Optional options.
 */
function connect(sheetId, options) {

    options = options || {};

    // TODO: needs better access token handling
    let api = apiFactory.getApi(options.version);
    let restClient = clientFactory({
        token: options.token,
        gApi: api,
        gCache: cache
    });

    return new Spreadsheet(sheetId, restClient, options);
}

module.exports = connect;
