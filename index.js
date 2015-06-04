var SheetDb = require('./lib/sheet_db');
var util = require('./lib/util');

/**
 * Connects and initializes the specific worksheet
 *
 * @param sheetId
 * @param options
 * @param callback
 */
function connect(sheetId, options, callback) {

    options = options || {};
    options.version = 'v3';

    var sheetDb = new SheetDb(sheetId, options);

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
