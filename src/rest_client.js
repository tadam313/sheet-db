'use strict';

var ApiError    = require('./api_error');
var apiFactory  = require('./api');
var util        = require('./util');
var request     = require('request');
var cache       = require('memory-cache');

var token = null;
var api   = null;

// TODO: need tests for this component

/**
 *  Executes the given request
 *
 * @param {string} opType Type of the operation
 * @param {object} options Options of the operation
 */
function executeRequest(opType, options) {
    if (token) {
        options.token = token;
    }

    // TODO: need to handle ETAG values
    var context = api.getOperationContext(opType, options);

    return new Promise((resolve, reject) => {
        request(context, (err, response, body) => {
            if (err || response.statusCode >= 400 || (context.method == 'GET' && !body)) {
                reject(new ApiError(response.statusCode, context, err));
            } else {
                resolve(body);
            }
        });
    });
}

/**
 * Tries to fetch the response from the cache and provides fallback if not found
 *
 * @param {string} key - Key of the data in the cache
 * @param {function} transformation - Transformation of the data
 * @param {function} cacheMiss - Handler in case of the data is not found in the cache
 * @returns {*}
 */
async function fetchData(key, transformation, cacheMiss) {

    // TODO: needs better caching logic
    var data = cache.get(key);

    if (data) {
        return data;
    }

    try {
        data = transformation(await cacheMiss());
    } catch (err) {
        throw new Error('The response contains invalid data');
    }

    cache.put(key, data);
    return data;
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
 */
async function querySheetInfo(sheetId) {
    var key = util.createIdentifier('sheet_info', sheetId);

    return await fetchData(key, api.converter.sheetInfoResponse,
        () => executeRequest('sheet_info', {sheetId: sheetId})
    );
}

/**
 * Creates the specific worksheet
 *
 * @param {string} sheetId ID of the sheet
 * @param {string} worksheetTitle name of the worksheet to be created
 * @param {object} options
 */
async function createWorksheet(sheetId, worksheetTitle, options) {
    options = Object.assign({ title: worksheetTitle }, options);

    let payload = api.converter.createWorksheetRequest(options);
    let response = await executeRequest('create_worksheet', {
        body: payload,
        sheetId: sheetId
    });

    cache.clear();

    // converts worksheetData to model
    return api.converter.workSheetInfoResponse(response);
}

/**
 * Drops the specific worksheet
 *
 * @param {string} sheetId
 * @param {string} worksheetId
 */
async function dropWorksheet(sheetId, worksheetId) {
    let response = await executeRequest('drop_worksheet', {
        sheetId: sheetId,
        worksheetId: worksheetId
    });

    cache.clear();
    return response;
}

/**
 *  Creates the specific entry
 *
 * @param {string} worksheetInfo
 * @param {array} entries
 */
async function insertEntries(worksheetInfo, entries) {
    let requests = entries.map(entry => {
        var payload = util._extend(
            {body: api.converter.createEntryRequest(entry)},
            worksheetInfo
        );

        return executeRequest('create_entry', payload);
    });

    let response = await Promise.all(requests);
    cache.clear();

    return response;
}

/**
 * Update the specified entries
 *
 * @param {object} worksheetInfo SheetID and worksheetID
 * @param {array} entries
 */
async function updateEntries(worksheetInfo, entries) {

    let requests = entries.map(entry => {
        var payload = util._extend({
                body: api.converter.updateEntryRequest(entry),
                entityId: entry._id
            },
            worksheetInfo
        );

        return executeRequest('update_entry', payload);
    });

    let response = Promise.all(requests);
    cache.clear();

    return response;
}

/**
 * Queries the specific worksheet
 *
 * @param {object} workSheetInfo worksheetInfo SheetID and worksheetID
 * @param {object} query Query descriptor
 * @param {object} options query options
 */
async function queryWorksheet(workSheetInfo, query, options) {
    var key = util.createIdentifier(
        workSheetInfo.worksheetId,
        JSON.stringify(query)
    );

    options = options || {};
    options.query = query;

    return await fetchData(
        key,
        api.converter.queryResponse,
        () => {
            let payload = util._extend(
                workSheetInfo,
                api.converter.queryRequest(options)
            );

            return executeRequest('query_worksheet', payload);
        });
}

/**
 *  Deletes specified entries
 *
 * @param {object} worksheetInfo worksheetInfo SheetID and worksheetID
 * @param {array} entityIds IDs of the entities
 */
async function deleteEntries(worksheetInfo, entityIds) {

    entityIds.reverse();

    // since google pushes up the removed row, the ID will change to the previous
    // avoiding this iterate through the collection in reverse order
    // TODO: needs performance improvement
    var response;

    for (let id of entityIds) {
        let payload = util._extend({entityId: id}, worksheetInfo);
        response = await executeRequest('delete_entry', payload);
    }

    cache.clear();
    return response;
}

/**
 * Queries the fields from the spreadsheet
 *
 * @param {object} workSheetInfo SheetID and worksheetID
 */
async function queryFields(workSheetInfo) {
    var key = util.createIdentifier(
        'queryFields',
        workSheetInfo.worksheetId
    );

    return await fetchData(
        key,
        api.converter.queryFieldNames,
        () => executeRequest('query_fields', workSheetInfo)
    );
}

/**
 * Create field names (first row) in the sheet
 *
 * @param {object} workSheetInfo SheetID and worksheetID
 * @param {array} fieldNames Name of the fields
 * @param {number} startIndex First column of new rows
 */
async function createColumns(workSheetInfo, fieldNames, startIndex) {
    if (!util.isArray(fieldNames)) {
        return Promise.reject(
            new Error('Field names should be specified in array format')
        );
    }

    let promises = fieldNames.map(fieldName => {
        let payload = api.converter.createFieldRequest(fieldName, ++startIndex);
        let requestPayload = util._extend(
            {body: payload, cellId: 'R1C' + startIndex},
            workSheetInfo
        );

        return executeRequest('create_field', requestPayload);
    });

    let response = await Promise.all(promises);
    cache.clear();
    return response;
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
        querySheetInfo,
        createWorksheet,
        dropWorksheet,
        insertEntries,
        queryWorksheet,
        deleteEntries,
        queryFields,
        createColumns,
        updateEntries,
        getApi,
        isAuthenticated
    };
};
