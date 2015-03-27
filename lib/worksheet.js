
var api         = require('./spreadsheet_api'),
    converter   = require('./model_converter');

var Worksheet = function(sheetId, worksheetId) {
    this.sheetId = sheetId;
    this.worksheetId = worksheetId;
};

Worksheet.prototype = {

    insertOne: function(line, callback) {
        var payload = converter.toCreateEntry(line);

        api.createEntry(this.sheetId, this.worksheetId, payload, function (err, response) {
            callback(err, converter.fromCreateEntry(response));
        });
    },

    insertMany: function () {
        throw new Exception('This is currently not supported');
    },

    update: function (lines) {

    },

    remove: function (lines) {

    }
};

module.exports = Worksheet;
