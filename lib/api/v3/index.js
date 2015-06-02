'use strict';

var apiSpec = require('./spec');
var converter = require('./converter');
var util    = require('util');
var tpl     = require('string-template');

/**
 *
 * @param opType
 * @returns {T}
 */
function getOperation(opType) {
    var opCandidate = Object.keys(apiSpec.operations)
        .filter(function(operation) {
            return operation === opType;
        });

    if (!opCandidate) {
        throw new Error('Operation is not supported');
    }

    return opCandidate[0];
}

/**
 *
 *
 * @param opType
 * @param options
 * @returns {T}
 */
function getOperationContext(opType, options) {

    var operation = getOperation(opType);

    options = options || {};
    options.visibility = !token ? 'public' : 'private';
    options.apiRoot = apiSpec.root;

    if (options.token) {
        operation.headers['Authorization'] = 'Bearer ' + options.token;
        delete options.token;
    }

    operation.url = tpl(operation.url, options);

    operation.headers = ctx.headers || {};
    operation.headers['GData-Version'] = Number(apiSpec.version).toFixed(1);

    operation.body = options.body;
    operation.strictSSL = false;

    return operation;
}

module.exports = util._extend(converter, {
    getOperationContext: getOperationContext
});
