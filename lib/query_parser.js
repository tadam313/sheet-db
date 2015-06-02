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
    var textQuery = '(';

    for (var i = 0; i < queryObject.length; i++) {
        textQuery += (i > 0 ? OPS[key] : '') + parse(queryObject[i], actualField);
    }

    return textQuery + ')';
}

/**
 *
 * @param queryObject
 * @param key
 * @returns {string}
 */
function equalityComparision(queryObject, key) {
    if (typeof queryObject !== 'object') {
        queryObject = {$eq: queryObject};
    }

    return parse(queryObject, key);
}

/**
 *
 * @param value
 * @returns {string}
 */
function handleValue(value) {
    // object is a literal

    if (typeof value === 'string') {
        value = '"' + value + '"';
    }

    return value;
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
            textQuery = logicalOperators(queryObject, actualField, key);
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
            var exp = containmentExpression(queryObject, actualField);
            textQuery += parse(exp, actualField);
            break;

        default:
            if (typeof query !== 'object') {
                textQuery = handleValue(query);
            } else if (queryObject) {
                textQuery =  equalityComparision(queryObject, key);
            }
            break;
    }

    return textQuery;
}

module.exports = {
    parse: parse
};
