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
    var opname = Object.keys(apiSpec.operations)
        .filter(function(operation) {
            return operation === opType;
        });

    if (!opname.length) {
        throw new ReferenceError('Operation is not supported');
    }

    return util._extend({}, apiSpec.operations[opname[0]]);
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
    options.visibility = !options.token ? 'public' : 'private';
    options.apiRoot = apiSpec.root;

    operation.headers = options.headers || {};
    operation.headers['GData-Version'] = Number(apiSpec.version).toFixed(1);

    if (options.token) {
        operation.headers['Authorization'] = 'Bearer ' + options.token;
        delete options.token;
    }

    operation.url = tpl(operation.url, options);

    operation.body = options.body;
    operation.strictSSL = false;

    return operation;
}

module.exports = util._extend(converter, {
    getOperationContext: getOperationContext
});
