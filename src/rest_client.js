'use strict';

var ApiError    = require('./api_error');
var apiFactory  = require('./api');
var util        = require('./util');
var request     = require('request');
var cache       = require('memory-cache');
var async       = require('async');

var token = null;
var api   = null;

// TODO: need tests for this component

/**
 *  Executes the given request
 *
 * @param {string} opType Type of the operation
 * @param {object} options Options of the operation
 * @param {function} callback
 */
function executeRequest(opType, options, callback) {
    if (token) {
        options.token = token;
    }

    // TODO: need to handle ETAG values
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
 * @param {function} transformation Calls this function for the body
 * @param {function} callback
 * @param {object} err Error from the server operatio
 * @param {object} body Body of the response from Google Api
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
 * @param {string} key Key of the data in the cache
 * @param {function} callback
 * @param {function} transformation Transformation of the data
 * @param {function} cacheMiss Handler in case of the data is not found in the cache
 * @returns {*}
 */
function fetchData(key, callback, transformation, cacheMiss) {
    if (typeof callback !== 'function') {
        return;
    }

    // TODO: needs better caching logic
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
 * @param {string} accessToken
 */
function setAccessToken(accessToken) {
    token = accessToken;
}

/**
 * Queries the specific sheet info.
 *
 * @param {string} sheetId
 * @param {function} callback
 */
function querySheetInfo(sheetId, callback) {
    var key = util.createIdentifier('sheet_info', sheetId);

    fetchData(key, callback, api.converter.sheetInfoResponse,
        function(resolve) {
            executeRequest('sheet_info', {sheetId: sheetId}, resolve);
        });
}

/**
 * Creates the specific worksheet
 *
 * @param {string} sheetId ID of the sheet
 * @param {object} options
 * @param {function} callback
 */
function createWorksheet(sheetId, options, callback) {
    var payload = api.converter.createWorksheetRequest(options);

    executeRequest('create_worksheet', {
        body: payload,
        sheetId: sheetId
    }, function(err, body) {
        cache.clear();
        handleResponse(null, callback, err, body);
    });
}

/**
 * Drops the specific worksheet
 *
 * @param {string} sheetId
 * @param {string} worksheetId
 * @param {function} callback
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
 * @param {string} worksheetInfo
 * @param {array} entries
 * @param {function} callback
 */
function insertEntries(worksheetInfo, entries, callback) {

    async.eachLimit(entries, 4, function(entry, callback) {
        var payload = util._extend(
            {body: api.converter.createEntryRequest(entry)},
            worksheetInfo
        );

        executeRequest('create_entry', payload, callback);
    }, function(err) {
        cache.clear();
        callback(err);
    });
}

/**
 * Update the specified entries
 *
 * @param {object} worksheetInfo SheetID and worksheetID
 * @param {array} entries
 * @param {function} callback
 */
function updateEntries(worksheetInfo, entries, callback) {

    if (!entries) {
        return callback();
    }

    async.eachLimit(entries, 4, function(entry, callback) {
        var payload = util._extend({
                body: api.converter.updateEntryRequest(entry),
                entityId: entry._id
            },
            worksheetInfo
        );

        executeRequest('update_entry', payload, callback);
    }, function(err) {
        cache.clear();
        callback(err);
    });
}

/**
 * Queries the specific worksheet
 *
 * @param {object} workSheetInfo worksheetInfo SheetID and worksheetID
 * @param {object} query Query descriptor
 * @param {object} options query options
 * @param {function} callback
 */
function queryWorksheet(workSheetInfo, query, options, callback) {
    var key = util.createIdentifier(
        workSheetInfo.worksheetId,
        JSON.stringify(query)
    );

    options = options || {};
    options.query = query;

    fetchData(key, callback, api.converter.queryResponse,
        function(resolve) {

            var payload = util._extend(
                workSheetInfo,
                api.converter.queryRequest(options)
            );

            executeRequest('query_worksheet', payload, resolve);
        });
}

/**
 *  Deletes specified entries
 *
 * @param {object} worksheetInfo worksheetInfo SheetID and worksheetID
 * @param {array} entityIds IDs of the entities
 * @param {function} callback
 */
function deleteEntries(worksheetInfo, entityIds, callback) {

    entityIds.reverse();

    // since google pushes up the removed row, the ID will change to the previous
    // avoiding this iterate through the collection in reverse order
    // TODO: needs performance improvement
    async.eachLimit(entityIds, 1, function(id, callback) {
        var payload = util._extend({entityId: id}, worksheetInfo);
        executeRequest('delete_entry', payload, callback);
    }, function(err) {
        cache.clear();
        callback(err);
    });
}

/**
 * Queries the fields from the spreadsheet
 *
 * @param {object} workSheetInfo SheetID and worksheetID
 * @param {function} callback
 */
function queryFields(workSheetInfo, callback) {
    var key = util.createIdentifier(
        'queryFields',
        workSheetInfo.worksheetId
    );

    fetchData(key, callback, api.converter.queryFieldNames,
        function(resolve) {
            executeRequest('query_fields', workSheetInfo, resolve);
        });
}

/**
 * Create field names (first row) in the sheet
 *
 * @param {object} workSheetInfo SheetID and worksheetID
 * @param {array} fieldNames Name of the fields
 * @param {number} startIndex First column of new rows
 * @param {function} callback
 */
function createColumns(workSheetInfo, fieldNames, startIndex, callback) {
    if (!util.isArray(fieldNames)) {
        return callback(
            new Error('Field names should be specified in array format')
        );
    }

    async.eachLimit(fieldNames, 4, function(fieldName, callback) {
        var payload = api.converter.createFieldRequest(fieldName, ++startIndex);

        var requestPayload = util._extend(
            {body: payload, cellId: 'R1C' + startIndex},
            workSheetInfo
        );

        executeRequest('create_field', requestPayload, callback);
    }, function(err) {
        cache.clear();
        callback(err);
    });
}

function getApi() {
    return api;
}

/**
 * Checks whether the client si operating in authenticated mode
 *
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!token;
}

module.exports = function(token, version) {

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
        createColumns: createColumns,
        updateEntries: updateEntries,
        getApi: getApi,
        isAuthenticated: isAuthenticated
    };
};
