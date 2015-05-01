"use strict";

var OPS = {
    $or:    ' or ',
    $and:   ' and ',

    $gt:    ' > ',
    $gte:   ' >= ',

    $lt:    ' < ',
    $lte:   ' <= ',

    $ne:    ' != ',
    $eq:    ' = '
};

module.exports = {

    /**
     * Parses the given query in spreadsheet API compatible format
     *
     * @param query
     * @returns {string}
     */
    parse: function(query) {
        query = query || {};

        var key = typeof query === 'object' ? Object.keys(query)[0] : null,
            textQuery = '';

        var queryObject = query[key];

        switch (key) {

            case '$and':
            case '$or':
                textQuery += this.parse(queryObject[0]);

                for (var i = 1; i < queryObject.length; i++) {
                    textQuery += OPS[key] + this.parse(queryObject[i]);
                }
                break;

            case '$lt':
            case '$lte':
            case '$gt':
            case '$gte':
            case '$ne':
            case '$eq':
                textQuery = OPS[key] + this.parse(queryObject);
                break;

            default:
                if (typeof queryObject === 'object') {
                    // object considered as field
                    textQuery = key + this.parse(queryObject);
                } else if (typeof query !== 'object') {
                    // object is a literal

                    if (typeof query === 'string') {
                        query = '"' + query + '"';
                    }

                    textQuery = query;
                }
                break;
        }

        return textQuery;
    }
};