"use strict";

var request = require('request'),
    tpl     = require('url-template');

module.exports = (function () {

    var token = null;

    var URLS = {
        'connect_sheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/{visibility}/full?alt=json',
        'create_worksheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/{visibility}/full?alt=json',
        'delete_worksheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/{visibility}/full/{sheetId}/version'
    };

    var getUrl = function (operation_type, options) {
        options = options || {};
        options.visibility = !token ? 'public': 'private';

        return tpl.parse(URLS[operation_type]).expand(options);
    };

    var setAccessToken = function (accessToken) {
        token = accessToken;
    };

    var crateRequest = function (operation_type, url_options, req_options, callback) {

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

        crateRequest('connect_sheet', { sheetId: sheetId }, null, function (err, response, body) {
            callback(err, JSON.parse(body));
        });
    };

    var createWorksheet = function (sheetId, payload, callback) {

        crateRequest('create_worksheet',
            { sheetId: sheetId },
            {
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

    return {
        setAccessToken: setAccessToken,

        querySheetInfo: querySheetInfo,

        createWorksheet: createWorksheet
    };

})();
