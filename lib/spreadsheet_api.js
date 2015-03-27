"use strict";

var request = require('request'),
    tpl     = require('url-template');

module.exports = (function () {

    var token = null;

    var URLS = {
        'connect_sheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/{visibility}/full?alt=json',
        'create_worksheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/{visibility}/full?alt=json',
        'remove_worksheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/{visibility}/full/{worksheetId}/version?alt=json',

        'create_entry': 'https://spreadsheets.google.com/feeds/list/{sheetId}/{worksheetId}/{visibility}/full?alt=json',
        'query_worksheet': 'https://spreadsheets.google.com/feeds/list/{sheetId}/{worksheetId}/{visibility}/full?alt=json&{filter}{sort_column}{sort_direction}',
        'delete_entry': 'https://spreadsheets.google.com/feeds/list/{sheetId}/{worksheetId}/{visibility}/full/{rowId}/rowVersion?alt=json'
    };

    var getUrl = function(operation_type, options) {
        options = options || {};
        options.visibility = !token ? 'public': 'private';

        return tpl.parse(URLS[operation_type]).expand(options);
    };

    var setAccessToken = function(accessToken) {
        token = accessToken;
    };

    var createRequest = function (operation_type, url_options, req_options, callback) {

        req_options = req_options || {
            method: 'GET',
            headers: {}
        };

        req_options.url = getUrl(operation_type, url_options);

        if (token) {
           req_options['url'] += '&access_token=' + token;
        }

        request(req_options, callback);
    };

    var querySheetInfo = function (sheetId, callback) {

        createRequest('connect_sheet', { sheetId: sheetId }, null, function (err, response, body) {
            callback(err, JSON.parse(body));
        });
    };

    var createWorksheet = function(sheetId, payload, callback) {

        createRequest('create_worksheet', {
                sheetId: sheetId }, {
                method: 'POST',
                body: payload,
                headers: {
                    'Content-Type': 'application/atom+xml'
                }
            },
            function (err, response, body) {

                callback(err, JSON.parse(body));
            }
        );
    };

    var removeWorksheet = function(sheetId, worksheetId, callback) {

        createRequest('remove_worksheet', {
                sheetId: sheetId,
                worksheetId: worksheetId
            }, { method: 'DELETE' },
            function (err, response, body) {

                callback(err, JSON.parse(body));
        });
    };

    var createEntry = function(worksheetId, payload, callback) {

        createRequest('create_entry', {
                sheetId: worksheetId.sheetId,
                worksheetId: worksheetId.worksheetId
            }, {
                method: 'POST',
                body: payload,
                headers: {
                    'Content-Type': 'application/atom+xml'
                }
            },
            function (err, response, body) {

                callback(err, JSON.parse(body));
            }
        );
    };

    var queryWorkSheet = function(worksheetId, options, callback) {

        createRequest('query_worksheet', {
                sheetId: worksheetId.sheetId,
                worksheetId: worksheetId.worksheetId
            },
            null,
            function (err, response, body) {

                callback(err, JSON.parse(body));
            }
        );
    };

    var deleteEntry = function(worksheetId, rowId, callback) {

        createRequest('delete_entry', {
                sheetId: worksheetId.sheetId,
                worksheetId: worksheetId.worksheetId,
                rowId: rowId
            }, {
                method: 'DELETE'
            }, function (err, response) {

                callback(err);
            }
        );
    };

    return {
        setAccessToken: setAccessToken,

        querySheetInfo: querySheetInfo,

        createWorksheet: createWorksheet,

        removeWorksheet: removeWorksheet,

        createEntry: createEntry,

        queryWorkSheet: queryWorkSheet,

        deleteEntry: deleteEntry
    };

})();
