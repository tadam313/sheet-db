"use strict";

var OPS = {
    $or:    ' or ',
    $and:   ' and ',

    $gt:    ' > ',
    $gte:   ' >= ',

    $lt:    ' < ',
    $lte:   ' <= '
};

/**
 * Parses the given query in spreadsheet API compatible format
 *
 * @param query
 * @returns {string}
 */
var parse = function(query) {
    query = query || {};

    var key = typeof query === 'object' ? Object.keys(query)[0] : null,
        textQuery = '';

    var queryObject = query[key];

    switch (key) {

        case '$and':
        case '$or':

            textQuery += parse(queryObject[0]);

            for (var i = 1; i < queryObject.length; i++) {
                textQuery += OPS[key] + parse(queryObject[i]);
            }
            break;

        case '$lt':
        case '$lte':
        case '$gt':
        case '$gte':

            textQuery = OPS[key] + parse(queryObject);
            break;

        default:

            if (typeof queryObject === 'object') {
                // object considered as field
                textQuery = key + parse(queryObject);
            } else if (typeof query !== 'object') {
                // object is a literal
                textQuery = query;
            }
            break;
    }

    return textQuery;
};

module.exports = {
    parse: parse
};