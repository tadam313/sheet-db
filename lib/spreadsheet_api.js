"use strict";

var c           = require('./model_converter'),
    ApiError    = require('./api_error'),
    request     = require('request'),
    tpl         = require('string-template'),
    cache       = require('memory-cache');

var token               = null,
    GOOGLE_API_VERSION  = 3,
    GOOGLE_API_ROOT     = 'https://spreadsheets.google.com/feeds';

var OPERATION_CONTEXTS = {

    'sheet_info': {
        url: '{apiRoot}/worksheets/{sheetId}/{visibility}/full?alt=json',
        method: 'GET'
    },

    'create_worksheet': {
        url: '{apiRoot}/worksheets/{sheetId}/{visibility}/full?alt=json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/atom+xml'
        }
    },

    'remove_worksheet': {
        url: '{apiRoot}/worksheets/{sheetId}/{visibility}/full/{worksheetId}/version?alt=json',
        method: 'GET'
    },

    'create_entry': {
        url: '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full?alt=json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/atom+xml'
        }
    },

    'query_worksheet': {
        url: '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full?alt=json{query}{orderBy}{reverse}',
        method: 'GET'
    },

    'query_fields': {
        url: '{apiRoot}/cells/{sheetId}/{worksheetId}/{visibility}/full?alt=json&min-row=1&max-row=1&min-col=1&max-col={fields_num}',
        method: 'GET'
    } ,

    'delete_entry': {
        url: '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full/{rowId}?alt=json',
        method: 'DELETE'
    }
};

/**
 *  Executes the request
 *
 * @param operation_type
 * @param options
 * @param callback
 */
var executeRequest = function(operation_type, options, callback) {
    var req_ctx = getContext(operation_type, options);

    request(req_ctx, function (err, response, body) {
        if (response.statusCode >= 300) {
            err = new ApiError(response.statusCode, req_ctx, err);
        }

        return callback(err, body);
    });
};

/**
 * Gets the specific operation context (HTTP headers, address etc...)
 *
 * @param operation_type
 * @param options
 * @returns {*}
 */
var getContext = function(operation_type, options) {
    options = options || {};
    options.visibility = !token ? 'public': 'private';
    options.apiRoot = GOOGLE_API_ROOT;

    var ctx = OPERATION_CONTEXTS[operation_type];
    ctx.url = tpl(ctx.url, options);

    ctx.headers = ctx.headers || {};
    ctx.headers['GData-Version'] = Number(GOOGLE_API_VERSION).toFixed(1);

    if (token) {
        ctx.headers['Authorization'] = 'Bearer ' + token;
    }

    ctx.body = options.body;

    return ctx;
};

/**
 * Handles the response with the specific transformation function
 *
 * @param err
 * @param body
 * @param transformation
 * @param callback
 * @returns {*}
 */
var handleResponse = function (transformation, callback, err, body) {
    if (typeof callback !== 'function')
        return;

    if (err)
        return callback(err);

    var convertedData = null;

    try {
        convertedData = typeof transformation === 'function'
            ? transformation(body)
            : c.convertGeneric(body);
    }
    catch (err) {
        return callback(new Error('The response contains invalid data'));
    }

    return callback(null, convertedData);
};

/**
 * Tries to fetch the response from the cache and provides fallback if it is not found
 *
 * @param key
 * @param callback
 * @param transformation
 * @param cacheMiss
 * @returns {*}
 */
var fetchData = function (key, callback, transformation, cacheMiss) {
    if (typeof callback !== 'function')
        return;

    var data = cache.get(key);

    if (data) {
        return callback(null, data);
    }

    cacheMiss(handleResponse.bind({}, transformation, function(err, data) {

        if (data) {
            cache.put(key, data);
        }

        return callback(err, data);
    }));
};

module.exports = {

    /**
     * Sets the access token for the API
     *
     * @param accessToken
     */
    setAccessToken: function(accessToken) {
        token = accessToken;
    },

    /**
     * Queries the specific sheet info.
     *
     * @param sheetId
     * @param callback
     */
    querySheetInfo: function(sheetId, callback) {
        var key = 'sheet_info:' + sheetId;

        fetchData(key, callback, c.sheetInfoResponse.bind(c), function (resolve) {
            executeRequest('sheet_info', { sheetId: sheetId }, resolve);
        });
    },

    /**
     * Creates the specific worksheet
     *
     * @param sheetId
     * @param options
     * @param callback
     */
    createWorksheet: function(sheetId, options, callback) {

        var payload = c.createWorksheetRequest(options);

        executeRequest('create_worksheet', {
                body: payload,
                sheetId: sheetId
            },
            handleResponse.bind({}, c.createWorksheetResponse, callback));
    },

    /**
     * Drops the specific worksheet
     *
     * @param sheetId
     * @param worksheetId
     * @param callback
     */
    dropWorksheet: function(sheetId, worksheetId, callback) {
        executeRequest('remove_worksheet', {
                sheetId: sheetId,
                worksheetId: worksheetId
            }, function (err, body) {
                cache.clear();
                handleResponse(null, callback, err ,body);
        });
    },

    /**
     *  Creates the specific entry
     *
     * @param worksheetId
     * @param entry
     * @param callback
     */
    insertEntry: function(worksheetId, entry, callback) {

        var payload = c.createEntryRequest(entry);

        executeRequest('create_entry', {
                sheetId: worksheetId.sheetId,
                worksheetId: worksheetId.worksheetId,
                body: payload
            }, function(err, body) {
                cache.clear();
                handleResponse(c.createEntryResponse.bind(c), callback, err, body);
        });
    },

    /**
     * Queries the specific worksheet
     *
     * @param worksheetId
     * @param query
     * @param options
     * @param callback
     */
    queryWorksheet: function(worksheetId, query, options, callback) {
        var key = worksheetId + JSON.stringify(query),
            orderBy, reverse;

        if (query && query.length > 0) {
            query = '&sq=' + encodeURIComponent(query);
        }

        if (options && options.sort) {
            orderBy = '&orderby=column:' + options.sort;
        }

        if (options && options.descending) {
            reverse = '&reverse=true';
        }

        fetchData(key, callback, c.queryResponse.bind(c), function(resolve) {
            executeRequest('query_worksheet', {
                sheetId: worksheetId.sheetId,
                worksheetId: worksheetId.worksheetId,
                query: query,
                orderBy: orderBy,
                reverse: reverse
            }, resolve);
        });
    },

    /**
     *  Deletes the specific entry
     *
     * @param worksheetId
     * @param rowId
     * @param callback
     */
    deleteEntry: function(worksheetId, rowId, callback) {
        executeRequest('delete_entry', {
                sheetId: worksheetId.sheetId,
                worksheetId: worksheetId.worksheetId,
                rowId: rowId
            }, function(err, body) {
                cache.clear();
                handleResponse(null, callback, err ,body);
        });
    }
};
