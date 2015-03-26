"use strict";

var request = require('request');

module.exports = (function () {

    var token = null;

    var URLS = {
        'connect_sheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/private/full?alt=json',
        'create_worksheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/private/full',
        'delete_worksheet': 'https://spreadsheets.google.com/feeds/worksheets/{sheetId}/private/full/{sheetId}/version'
    };

    var getUrl = function (operation_type, options) {
        var url = URLS[operation_type];

        if (options) {

        }

        return url;
    };

    var setAccessToken = function (accessToken) {
        token = accessToken;
    };

    var crateRequest = function (operation_type, req_options, callback) {

        var options = {
            url: getUrl(operation_type),
            headers: {}
        };

        for (var key in req_options) {
            options.url = options.url.replace('{' + key + '}', req_options[key]);
        }


        if (token) {

           options['url'] += '&access_token=' + token;
        }

        console.log(options);

        request(options, callback);
    };

    var querySheetInfo = function (sheetId, callback) {

        crateRequest('connect_sheet', { sheetId: sheetId }, function (err, response, body) {

            callback(err, JSON.parse(body));
        });
    };

    return {
        setAccessToken: setAccessToken,

        querySheetInfo: querySheetInfo
    };

})();