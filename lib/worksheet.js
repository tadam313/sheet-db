
var api         = require('./spreadsheet_api'),
    converter   = require('./model_converter'),
    cache       = require('memory-cache');

var Worksheet = function(sheetId, worksheetId) {
    this.worksheetId = {
        sheetId: sheetId,
        worksheetId: worksheetId
    } ;
};

Worksheet.prototype = {

    find: function (queryOptions, callback) {

        var key = this.getQueryKey(queryOptions);

        var result = cache.get(key);

        if (result) {
            callback(null, result);
            return;
        }

        api.queryWorkSheet(this.worksheetId, queryOptions, function (err, response) {

            var result = converter.fromQuery(response);
            cache.put(key, result);

            callback(err, result);
        });
    },

    insertOne: function(line, callback) {
        var payload = converter.toCreateEntry(line);

        api.createEntry(this.worksheetId, payload, function (err, response) {
            callback(err, converter.fromCreateEntry(response));
        });
    },

    insert: function () {
        throw new Exception('This is currently not supported');
    },

    update: function (lines) {

    },

    remove: function (lines) {

    },

    getQueryKey: function (queryOptions) {
        return JSON.stringify({
            worksheetId: this.worksheetId,
            options: queryOptions
        });
    }
};

module.exports = Worksheet;
