'use strict';

var util = require('./util');

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
 * Transform containment operators ($in, $nin) to 'and', 'or' logical operations
 * which could be handled easily by the parser. E.g: field: {$in: [1, 2]} -> field = 1 or field = 2
 *
 * @param {object} queryObject Which contains the operator.
 * @param {string} actualField Current field of the object which the filter is operating on.
 * @param {string} key Should be '$in' or '$nin'. The current operation key.
 * @returns {object} Translated query
 */
function containmentOperator(queryObject, actualField, key) {
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
 * Converts binary operator queries into string by applying operator and
 * recursively invokes parsing process for rvalue.
 *
 * @param {object} queryObject Which contains the operator.
 * @param {string} actualField Current field of the object which the filter is operating on.
 * @param {string} key The current operation key.
 * @returns {string}
 */
function binaryOperator(queryObject, actualField, key) {
    return actualField + OPS[key] + stringify(queryObject, actualField);
}

/**
 * Converts logical operator queries into string by applying operator and
 * recursively invokes parsing process for rvalue.
 *
 * @param {object} queryObject Which contains the operator.
 * @param {string} actualField Current field of the object which the filter is operating on.
 * @param {string} key Should be '$and' or '$or'. The current operation key.
 * @returns {string}
 */
function logicalOperator(queryObject, actualField, key) {
    var textQuery = '(';

    for (var i = 0; i < queryObject.length; i++) {
        textQuery += (i > 0 ? OPS[key] : '') + stringify(queryObject[i], actualField);
    }

    return textQuery + ')';
}

/**
 * Converts equal queries into string
 *
 * @param {object} queryObject Which contains the operator.
 * @param {string} key Should be '$and' or '$or'. The current operation key.
 * @returns {string}
 */
function equalityOperator(queryObject, key) {
    if (typeof queryObject !== 'object') {
        queryObject = {$eq: queryObject};
    }

    return stringify(queryObject, key);
}

/**
 * Handle values, basically these are the leaves of the query tree.
 *
 * @param {*} value PLain simple value
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
 * Parses the given query and converts it to Google SQ compatible format. Basically it creates a tree
 * representation of the query and walk it recursively.
 * Read more here: https://developers.google.com/chart/interactive/docs/querylanguage
 *
 * @param {object} query
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
            textQuery = logicalOperator(queryObject, actualField, key);
            break;

        case '$lt':
        case '$lte':
        case '$gt':
        case '$gte':
        case '$ne':
        case '$eq':
            textQuery = binaryOperator(queryObject, actualField, key);
            break;

        case '$in':
        case '$nin':
            var exp = containmentOperator(queryObject, actualField, key);
            textQuery += stringify(exp, actualField);
            break;

        default:

            // $id and $updated are internal properteis they are good to go
            if (key && key[0] === '$' && !~['$id', '$updated'].indexOf(key)) {
                break;
            }

            if (typeof query !== 'object') {
                textQuery = handleValue(query);
            } else if (queryObject) {
                textQuery =  equalityOperator(queryObject, key);
            }
            break;
    }

    return textQuery;
}

/**
 * Updates the object based on the MongoDB specification. It wont mutate the original object
 *
 * @param {object} originalObject Original object
 * @param {object} descriptor Update description
 * @returns {*}
 */
function updateObject(originalObject, descriptor) {

    var object = util._extend(originalObject instanceof Array ? [] : {}, originalObject);

    if (!isUpdateDescriptor(descriptor)) {
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
 * Checks whether the given object is Mongo update descriptor or not.
 *
 * @param {*} descriptor Candidate descriptor being checked
 * @returns {boolean}
 */
function isUpdateDescriptor(descriptor) {
    if (typeof descriptor !== 'object' || !descriptor) {
        return false;
    }

    var keys = Object.keys(descriptor);
    return Boolean(~keys.indexOf('$set') || ~keys.indexOf('$currentDate'));
}

module.exports = {
    stringify: stringify,
    updateObject: updateObject,
    isUpdateDescriptor: isUpdateDescriptor
};
