'use strict';

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

/**
 *
 * @param queryObject
 * @param actualField
 * @returns {{$or: (Array|*)}}
 */
function containmentExpression(queryObject, actualField) {

    return {
        $or: queryObject.map(function(value) {
            var equalityExpression = {};
            equalityExpression[actualField] = value;

            return equalityExpression;
        })
    };
}

/**
 *
 * @param queryObject
 * @param actualField
 * @param key
 * @returns {string}
 */
function binaryExpression(queryObject, actualField, key) {
    return actualField + OPS[key] + parse(queryObject, actualField);
}

/**
 *
 * @param queryObject
 * @param actualField
 * @param key
 * @returns {string}
 */
function logicalOperators(queryObject, actualField, key) {
    var textQuery = parse(queryObject[0], actualField);

    for (var i = 1; i < queryObject.length; i++) {
        textQuery += OPS[key] + parse(queryObject[i], actualField);
    }

    return textQuery;
}

/**
 * Parses the given query in spreadsheet API compatible format
 *
 * @param query
 * @param actualField
 * @returns {string}
 */
function parse(query, actualField) {
    query = query || {};

    var key = typeof query === 'object' ? Object.keys(query)[0] : null;
    var textQuery = '';

    var queryObject = query[key];

    switch (key) {

        case '$and':
        case '$or':
            textQuery += logicalOperators(queryObject, actualField, key);
            break;

        case '$lt':
        case '$lte':
        case '$gt':
        case '$gte':
        case '$ne':
        case '$eq':
            textQuery = binaryExpression(queryObject, actualField, key);
            break;

        case '$in':
            var exp =  containmentExpression(queryObject, actualField);
            textQuery = parse(exp, actualField);
            break;

        default:
            if (typeof query !== 'object') {
                // object is a literal

                if (typeof query === 'string') {
                    query = '"' + query + '"';
                }

                textQuery = query;
            } else if (queryObject) {

                if (typeof queryObject !== 'object') {
                    queryObject = {$eq: queryObject};
                }

                // object considered as field
                textQuery = parse(queryObject, key);
            }
            break;
    }

    return textQuery;
}

module.exports = {
    parse: parse
};
