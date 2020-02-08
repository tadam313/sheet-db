'use strict';

class ApiError extends Error {

    /**
     * Creates an ApiError object which represents an error in the context of
     * spreadsheet API.
     *
     * @param {number} statusCode Received HTTP status code fro spreadsheet API
     * @param {object} requestContext Concrete operation context
     * @param {Error} previousError Reserved for error chaining
     * @constructor
     */
    constructor(statusCode, requestContext, innerError) {
        super(`${innerError ? innerError.message : ''}`);
        this.status = statusCode;
        this.context = requestContext;
        this.message = ApiError.statusDescription(this.status) + this.message;
    }

    /**
     * Friendly error representation
     *
     * @returns {string}
     */
    static statusDescription(status) {
        switch (status) {
            case 405:
                return 'Method not allowed';

            case 401:
            case 403:
                return 'Unauthorized';
        }

        return 'Something went wrong';
    }
}

module.exports = ApiError;
