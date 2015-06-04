// jscs:disable
'use strict';

var OPS = {
    $or:    ' or ',
    $and:   ' and ',

    $gt:    ' > ',
    $gte:   ' >= ',

    $lt:    ' < ',
    $lte:   ' <= ',

    $ne:    ' <> ',
    $eq:    ' = '
};

/**
 *
 * @param queryObject
 * @param actualField
 * @param key
 * @returns {{$or: (Array|*)}}
 */
function containmentExpression(queryObject, actualField, key) {

    var substitution = {};
    substitution[key === '$in' ? '$or' : '$and'] = queryObject.map(function(value) {
        var expression = {};
        expression[actualField] = {};
        expression[actualField][key === '$in' ? '$eq' : '$ne'] = value;

        return expression;
    });

    return substitution;
}

/**
 *
 * @param queryObject
 * @param actualField
 * @param key
 * @returns {string}
 */
function binaryExpression(queryObject, actualField, key) {
    return actualField + OPS[key] + stringify(queryObject, actualField);
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
        textQuery += (i > 0 ? OPS[key] : '') + stringify(queryObject[i], actualField);
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

    return stringify(queryObject, key);
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
 * Parses the given query and converts it to Google SQ compatible format.
 * Read more here: https://developers.google.com/chart/interactive/docs/querylanguage
 *
 * @param query
 * @param actualField
 * @returns {string}
 */
function stringify(query, actualField) {
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
        case '$nin':
            var exp = containmentExpression(queryObject, actualField, key);
            textQuery += stringify(exp, actualField);
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

/**
 * Mutates te object based on the Mongo specification
 *
 * @param object
 * @param descriptor
 * @returns {*}
 */
function mutateObjects(object, descriptor) {

    if (!isMutatorDescriptor(descriptor)) {
        return descriptor && typeof descriptor === 'object' ? descriptor : object;
    }

    var mutator = function(descObj, transform) {
        if (!descObj) {
            return;
        }

        if (object instanceof Array) {
            object = object.map(function(item) {
                Object.keys(descObj).forEach(function(key) {
                    transform(item, key, descObj[key]);
                });

                return item;
            });

        } else {
            Object.keys(descObj).forEach(function(key) {
                transform(object, key, descObj[key]);
            });
        }
    };

    mutator(descriptor['$set'], function(object, key, val) {
        if (object.hasOwnProperty(key)) {
            object[key] = val;
        }
    });

    var now = new Date();
    mutator(descriptor['$currentDate'], function(object, key, val) {
        if (val) {
            object[key] = now;
        }
    });

    return object;
}

/**
 * Checks whether the given object is Mongo mutator descriptor or not.
 *
 * @param descriptor
 * @returns {*}
 */
function isMutatorDescriptor(descriptor) {
    if (typeof descriptor !== 'object' || !descriptor) {
        return false;
    }

    var keys = Object.keys(descriptor);
    return Boolean(~keys.indexOf('$set') || ~keys.indexOf('$currentDate'));
}

module.exports = {
    stringify: stringify,
    mutateObjects: mutateObjects,
    isMutatorDescriptor: isMutatorDescriptor
};
