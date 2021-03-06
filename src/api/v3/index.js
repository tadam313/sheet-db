'use strict';

var converter = require('./converter');
var util    = require('../../util');
var tpl     = require('string-template');

var APISPEC = {
    'root': 'https://spreadsheets.google.com/feeds',
    'version': '3',
    'operations': {
        'sheet_info': {
            'url': '{apiRoot}/worksheets/{sheetId}/{visibility}/full?alt=json',
            'method': 'GET',
            'json': true
        },
        'create_worksheet': {
            'url': '{apiRoot}/worksheets/{sheetId}/{visibility}/full?alt=json',
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/atom+xml'
            }
        },
        'drop_worksheet': {
            'url': '{apiRoot}/worksheets/{sheetId}/{visibility}/full/{worksheetId}?alt=json',
            'method': 'DELETE'
        },
        'create_entry': {
            'url': '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full?alt=json',
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/atom+xml'
            }
        },
        'query_worksheet': {
            'url': '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full?alt=json{query}{orderBy}{reverse}',
            'method': 'GET',
            'json': true
        },
        'update_entry': {
            'url': '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full/{entityId}?alt=json',
            'method': 'PUT',
            'headers': {
                'Content-Type': 'application/atom+xml',
                'If-Match': '*'
            }
        },
        'delete_entry': {
            'url': '{apiRoot}/list/{sheetId}/{worksheetId}/{visibility}/full/{entityId}?alt=json',
            'method': 'DELETE',
            'headers': {
                'If-Match': '*'
            }
        },
        'query_fields': {
            'url': '{apiRoot}/cells/{sheetId}/{worksheetId}/{visibility}/full?alt=json&min-row=1&max-row=1&min-col=1&max-col={colCount}',
            'method': 'GET',
            'json': true
        },
        'create_field': {
            'url': '{apiRoot}/cells/{sheetId}/{worksheetId}/{visibility}/full/{cellId}?alt=json',
            'method': 'PUT',
            'headers': {
                'Content-Type': 'application/atom+xml',
                'If-Match': '*'
            }
        }
    }
};

/**
 * Retrieves te operation description
 *
 * @param opType
 * @returns {*}
 */
function getOperation(opType) {
    var opname = Object.keys(APISPEC.operations)
        .filter(function(operation) {
            return operation === opType;
        });

    if (!opname.length) {
        throw new ReferenceError('Operation is not supported');
    }

    // avoid mutation
    return util._extend({}, APISPEC.operations[opname[0]]);
}

/**
 * Retrieves the operation context for the given type
 *
 * @param opType
 * @param options
 * @returns {*}
 */
function getOperationContext(opType, options) {

    var operation = getOperation(opType);

    options = options || {};
    options.visibility = !options.token ? 'public' : 'private';
    options.apiRoot = APISPEC.root;

    operation.headers = operation.headers || {};
    operation.headers['GData-Version'] = Number(APISPEC.version).toFixed(1);

    if (options.token) {
        operation.headers['Authorization'] = 'Bearer ' + options.token;
        delete options.token;
    }

    operation.url = tpl(operation.url, options);

    operation.body = options.body;
    operation.strictSSL = false;

    return operation;
}

module.exports = {
    getOperationContext: getOperationContext,
    converter: converter,
    spec: APISPEC
};
