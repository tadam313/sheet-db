"use strict";

var request = require('request'),
    tpl     = require('url-template');


var token       = null,
    request_ctx = null,
    emitter     = null;

function Sheet_Api () {

}

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

var createRequest = function(operation_type, url_options, req_options, callback) {

    req_options = req_options || {
        method: 'GET',
        headers: {}
    };

    req_options.url = getUrl(operation_type, url_options);

    if (token) {
       req_options['url'] += '&access_token=' + token;
    }

    request(req_options, function (err, response, body) {

        if (response.statusCode == 401) {

            request_ctx = {
                operation_type: operation_type,
                url_options: url_options,
                req_options: req_options,
                callback: callback
            };

            emitter.emit('bad_access_token');
        } else {
            callback(err, response, body);
        }
    });
};

var querySheetInfo = function(sheetId, callback) {

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

Sheet_Api.prototype = {
    setAccessToken: setAccessToken,
    querySheetInfo: querySheetInfo,
    createWorksheet: createWorksheet,
    removeWorksheet: removeWorksheet,
    createEntry: createEntry,
    queryWorkSheet: queryWorkSheet,
    deleteEntry: deleteEntry,

    setEvents: function (events) {

        emitter = events;

        emitter.on('access_token_updated', function (token) {

            setAccessToken(token);

            if (request_ctx && token) {

                createRequest(
                    request_ctx.operation_type,
                    request_ctx.url_options,
                    request_ctx.req_options,
                    request_ctx.callback);
            }

            request_ctx = null;
        });
    }
};

module.exports = new Sheet_Api();
