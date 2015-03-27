
var converter   = require('./model_converter'),
    cache       = require('memory-cache');

var api = null;

var Worksheet = function(sheetId, worksheetId, sheet_api) {
    this.worksheetId = {
        sheetId: sheetId,
        worksheetId: worksheetId
    };

    api = sheet_api;
};

Worksheet.prototype = {

    find: function (query, callback) {
        var key = this.getQueryKey(query),
            result = cache.get(key);

        if (result) {
            callback(null, result);
        }
        else {
            api.queryWorkSheet(this.worksheetId, query, function (err, response) {

                var result = converter.fromQuery(response);
                cache.put(key, result);

                callback(err, result);
            });
        }
    },

    findOne: function (query, callback) {

        this.find(query, function (err, data) {
            if (err) {
                callback(err, null);
            } else if (!data) {
                callback(new Error('Data is not exists'), null);
            } else {

                callback(null, data[0]);
            }
        });
    },

    insertOne: function(entry, callback) {
        var payload = converter.toCreateEntry(entry);

        api.createEntry(this.worksheetId, payload, function (err, response) {
            callback(err, converter.fromCreateEntry(response));
        });
    },

    deleteOne: function (query, callback) {
        var self = this;

        if (query['$id'] && typeof query['$id'] === 'string') {
            // plain simple delete fow now
            api.deleteEntry(self.worksheetId, query['$id'], callback);
        } else {
            this.findOne(query, function (err, data) {

                if (err) {
                    callback(err, null);
                }
                else if (!data) {
                    callback(new Error('Data is not exists'), null);
                } else {

                    api.deleteEntry(self.worksheetId, data['$id'], callback);
                }
            });
        }
    },

    insert: function (entries, callback) {
        throw new Error('This is currently not supported');
    },

    update: function (query, callback) {
        throw new Error('This is currently not supported');
    },

    delete: function (query, callback) {
        throw new Error('This is currently not supported');
    },

    getQueryKey: function (queryOptions) {
        return JSON.stringify({
            worksheetId: this.worksheetId,
            options: queryOptions
        });
    }
};

module.exports = Worksheet;
