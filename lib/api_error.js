'use strict';

var util = require('./util');

/**
 * Creates an ApiError object which represents an error in the context of
 * spreadsheet API.
 *
 * @param {number} statusCode Received HTTP status code fro spreadsheet API
 * @param {object} requestContext Concrete operation context
 * @param {Error} previousError Reserved for error chaining
 * @constructor
 */
function ApiError(statusCode, requestContext, previousError) {
    this.status = statusCode;
    this.context = requestContext;
    this.message = this.toString();

    if (previousError) {
        this.message += ' {' + previousError.message + '}';
    }
}

util.inherits(ApiError, Error);

/**
 * Friendly error representation
 *
 * @returns {string}
 */
ApiError.prototype.toString = function() {

    switch (this.status) {

        case 405:
            return 'Method not allowed';

        case 401:
        case 403:
            return 'Unauthorized';
    }

    return 'Something went wrong';
};

module.exports = ApiError;
