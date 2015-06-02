'use strict';

var util = require('util');

function ApiError(statusCode, requestContext, previousError) {
    this.status = statusCode;
    this.context = requestContext;
    this.message = this.friendlyMessage();

    if (previousError) {
        this.message += ' {' + previousError.message + '}';
    }
}

util.inherits(ApiError, Error);

ApiError.prototype.friendlyMessage = function() {

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
