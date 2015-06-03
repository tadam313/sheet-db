var SheetDb = require('./lib/sheet_db');

/**
 * Connects and initializes the specific worksheet
 *
 * @param sheetId
 * @param callback
 */
function connect(sheetId, callback) {
    var options = {};
    options.version = options.version || 'v3';

    var sheetDb = new SheetDb(sheetId, options);

    sheetDb.sheetInfo(function(err) {
        if (err) {
            return callback(err);
        }

        callback(null, sheetDb);
    });
}

module.exports = {
    connect: connect
};
