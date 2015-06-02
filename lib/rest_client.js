'use strict';

var ApiError    = require('./api_error');
var dataUtil    = require('./data_util');
var request     = require('request');
var cache       = require('memory-cache');
var async       = require('async');
var util        = require('util');
var apiFactory  = require('./api')

var token = null;

/**
 *  Executes the request
 *
 * @param opType
 * @param options
 * @param callback
 */
var executeRequest = function(opType, options, callback) {
    var context = apiFactory.getApi('v3')
        .getOperationContext(opType, options);

    request(context, function(err, response, body) {
        if (response.statusCode >= 300) {
            err = new ApiError(response.statusCode, context, err);
        }

        return callback(err, body);
    });
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
var handleResponse = function(transformation, callback, err, body) {
    if (typeof callback !== 'function') {
        return;
    }

    if (err) {
        return callback(err);
    }

    var convertedData = null;

    try {
        convertedData = typeof transformation === 'function' ?
            transformation(body) : body;
    } catch (err) {
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
var fetchData = function(key, callback, transformation, cacheMiss) {
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
        var key = dataUtil.createIdentifier('sheet_info', sheetId);

        fetchData(key, callback, conveter.sheetInfoResponse.bind(conveter),
            function(resolve) {
                executeRequest('sheet_info', {sheetId: sheetId}, resolve);
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
        var payload = conveter.createWorksheetRequest(options);

        executeRequest('create_worksheet', {
                body: payload,
                sheetId: sheetId
            },
            handleResponse.bind({},
                conveter.createWorksheetResponse,
                callback));
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
        }, function(err, body) {
            cache.clear();
            handleResponse(null, callback, err, body);
        });
    },

    /**
     *  Creates the specific entry
     *
     * @param worksheetInfo
     * @param entries
     * @param callback
     */
    insertEntries: function(worksheetInfo, entries, callback) {

        async.each(entries, function(entry, callback) {

            var payload = util._extend(
                {body: conveter.createEntryRequest(entry)},
                worksheetInfo
            );

            executeRequest('create_entry', payload, function(err, body) {
                cache.clear();
                handleResponse(conveter.createEntryResponse
                    .bind(conveter), callback, err, body);
            });
        }, callback);
    },

    /**
     * Queries the specific worksheet
     *
     * @param workSheetInfo
     * @param query
     * @param options
     * @param callback
     */
    queryWorksheet: function(workSheetInfo, query, options, callback) {
        var key = dataUtil.createIdentifier(
            workSheetInfo.worksheetId,
            JSON.stringify(query)
        );

        var orderBy
        var reverse;

        if (query && query.length > 0) {
            query = '&sq=' + encodeURIComponent(query);
        }

        if (options && options.sort) {
            orderBy = '&orderby=column:' + options.sort;
        }

        if (options && options.descending) {
            reverse = '&reverse=true';
        }

        fetchData(key, callback, conveter.queryResponse.bind(conveter),
            function(resolve) {
                var payload = util._extend({
                    query: query,
                    orderBy: orderBy,
                    reverse: reverse
                }, workSheetInfo);

                executeRequest('query_worksheet', payload, resolve);
            });
    },

    /**
     *  Deletes specified entries
     *
     * @param worksheetInfo
     * @param rowIds
     * @param callback
     */
    deleteEntries: function(worksheetInfo, rowIds, callback) {

        async.each(rowIds, function(rowId, callback) {
            var payload = util._extend({rowId: rowId}, worksheetInfo);

            executeRequest('delete_entry', payload, function(err, body) {
                cache.clear();
                handleResponse(null, callback, err, body);
            });
        }, callback);
    },

    /**
     * Queries the fields from the spreadsheet
     *
     * @param workSheetInfo
     * @param callback
     */
    queryFields: function(workSheetInfo, callback) {
        var key = dataUtil.createIdentifier(
            'queryFields',
            workSheetInfo.worksheetId
        );

        fetchData(key, callback, conveter.queryFieldNames.bind(conveter),
            function(resolve) {
                executeRequest('query_fields', workSheetInfo, resolve);
            });
    },

    /**
     * Create field names in the sheet
     *
     * @param fieldNames
     * @param workSheetInfo
     * @param startIndex
     * @param callback
     */
    createColumns: function(fieldNames, workSheetInfo, startIndex, callback) {
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
};
