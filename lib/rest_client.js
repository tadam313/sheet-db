'use strict';

var ApiError    = require('./api_error');
var dataUtil    = require('./data_util');
var apiFactory  = require('./api');
var request     = require('request');
var cache       = require('memory-cache');
var async       = require('async');
var util        = require('util');

var token = null;
var api   = null;

/**
 *  Executes the request
 *
 * @param opType
 * @param options
 * @param callback
 */
function executeRequest(opType, options, callback) {
    if (token) {
        options.token = token;
    }

    var context = api.getOperationContext(opType, options);

    request(context, function(err, response, body) {
        if (response.statusCode >= 300) {
            err = new ApiError(response.statusCode, context, err);
        }

        return callback(err, body);
    });
}

/**
 * Handles the response with the specific transformation function
 *
 * @param err
 * @param body
 * @param transformation
 * @param callback
 * @returns {*}
 */
function handleResponse(transformation, callback, err, body) {
    if (typeof callback !== 'function') {
        return;
    }

    if (err) {
        return callback(err);
    }

    var convertedData = null;

    try {
        convertedData = typeof transformation === 'function' ?
            transformation.call(api, body) : body;
    } catch (err) {
        return callback(new Error('The response contains invalid data'));
    }

    return callback(null, convertedData);
}

/**
 * Tries to fetch the response from the cache and provides fallback if it is not found
 *
 * @param key
 * @param callback
 * @param transformation
 * @param cacheMiss
 * @returns {*}
 */
function fetchData(key, callback, transformation, cacheMiss) {
    if (typeof callback !== 'function') {
        return;
    }

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
}

/**
 * Sets the access token for the API
 *
 * @param accessToken
 */
function setAccessToken(accessToken) {
    token = accessToken;
}

/**
 * Queries the specific sheet info.
 *
 * @param sheetId
 * @param callback
 */
function querySheetInfo(sheetId, callback) {
    var key = dataUtil.createIdentifier('sheet_info', sheetId);

    fetchData(key, callback, api.sheetInfoResponse,
        function(resolve) {
            executeRequest('sheet_info', {sheetId: sheetId}, resolve);
        });
}

/**
 * Creates the specific worksheet
 *
 * @param sheetId
 * @param options
 * @param callback
 */
function createWorksheet(sheetId, options, callback) {
    var payload = api.createWorksheetRequest(options);

    executeRequest('create_worksheet', {
            body: payload,
            sheetId: sheetId
        },
        handleResponse.bind({},
            api.createWorksheetResponse,
            callback));
}

/**
 * Drops the specific worksheet
 *
 * @param sheetId
 * @param worksheetId
 * @param callback
 */
function dropWorksheet(sheetId, worksheetId, callback) {
    executeRequest('drop_worksheet', {
        sheetId: sheetId,
        worksheetId: worksheetId
    }, function(err, body) {
        cache.clear();
        handleResponse(null, callback, err, body);
    });
}

/**
 *  Creates the specific entry
 *
 * @param worksheetInfo
 * @param entries
 * @param callback
 */
function insertEntries(worksheetInfo, entries, callback) {

    async.each(entries, function(entry, callback) {

        var payload = util._extend(
            {body: api.createEntryRequest(entry)},
            worksheetInfo
        );

        executeRequest('create_entry', payload, function(err, body) {
            cache.clear();
            handleResponse(api.createEntryResponse,
                callback, err, body);
        });
    }, callback);
}

/**
 * Queries the specific worksheet
 *
 * @param workSheetInfo
 * @param query
 * @param options
 * @param callback
 */
function queryWorksheet(workSheetInfo, query, options, callback) {
    var key = dataUtil.createIdentifier(
        workSheetInfo.worksheetId,
        JSON.stringify(query)
    );

    fetchData(key, callback, api.queryResponse,
        function(resolve) {

            var payload = util._extend(
                workSheetInfo,
                api.queryRequest(options)
            );

            executeRequest('query_worksheet', payload, resolve);
        });
}

/**
 *  Deletes specified entries
 *
 * @param worksheetInfo
 * @param rowIds
 * @param callback
 */
function deleteEntries(worksheetInfo, rowIds, callback) {

    async.each(rowIds, function(rowId, callback) {
        var payload = util._extend({rowId: rowId}, worksheetInfo);

        executeRequest('delete_entry', payload, function(err, body) {
            cache.clear();
            handleResponse(null, callback, err, body);
        });
    }, callback);
}

/**
 * Queries the fields from the spreadsheet
 *
 * @param workSheetInfo
 * @param callback
 */
function queryFields(workSheetInfo, callback) {
    var key = dataUtil.createIdentifier(
        'queryFields',
        workSheetInfo.worksheetId
    );

    fetchData(key, callback, api.queryFieldNames,
        function(resolve) {
            executeRequest('query_fields', workSheetInfo, resolve);
        });
}

/**
 * Create field names in the sheet
 *
 * @param fieldNames
 * @param workSheetInfo
 * @param startIndex
 * @param callback
 */
function createColumns(fieldNames, workSheetInfo, startIndex, callback) {
    if (!util.isArray(fieldNames)) {
        return callback(
            new Error('Field names should be specified in array format')
        );
    }

    async.each(fieldNames, function(fieldName, callback) {
        var payload = conveter.createFieldRequest(fieldName, ++startIndex);

        var requestPayload = util._extend(
            {body: payload, cellId: 'R1C' + startIndex},
            workSheetInfo
        );

        executeRequest('create_field', requestPayload, function(err) {
            cache.clear();
            return callback(err);
        });

    }, callback);
}

module.exports = function(version, token) {

    api = apiFactory.getApi(version || 'v3');

    if (token) {
        setAccessToken(token);
    }

    return {
        setAccessToken: setAccessToken,
        querySheetInfo: querySheetInfo,
        createWorksheet: createWorksheet,
        dropWorksheet: dropWorksheet,
        insertEntries: insertEntries,
        queryWorksheet: queryWorksheet,
        deleteEntries: deleteEntries,
        queryFields: queryFields,
        createColumns: createColumns
    };
};
