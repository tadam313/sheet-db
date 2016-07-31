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

var UPDATE_OPS = {
    '$set': (object, key, val) => {
        if (object.hasOwnProperty(key)) {
            object[key] = val;
        }
    },
    '$inc': (object, key, val) => {
        if (typeof object[key] === 'number') {
            object[key] += val;
        }
    },
    '$mul': (object, key, val) => {
        if (typeof object[key] === 'number') {
            object[key] *= val;
        }
    },
    '$min': (object, key, val) => {
        if (typeof object[key] === 'number') {
            object[key] = object[key] > val ? val : object[key] ;
        }
    },
    '$max': (object, key, val) => {
        if (typeof object[key] === 'number') {
            object[key] = object[key] < val ? val : object[key] ;
        }
    },
    '$currentDate': (object, key, val) => {
        if (val) {
            object[key] = new Date();
        }
    }
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
    let substitution = {};

    substitution[key === '$in' ? '$or' : '$and'] = queryObject.map(value => {
        let expression = {};
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
    let textQuery = '(';

    for (let i = 0; i < queryObject.length; i++) {
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
        value = `"${value}"`;
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

    let key = typeof query === 'object' ? Object.keys(query)[0] : null;
    let textQuery = '';

    let queryObject = query[key];

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
            let exp = containmentOperator(queryObject, actualField, key);
            textQuery += stringify(exp, actualField);
            break;

        default:

            // $id and $updated are internal properteis they are good to go
            if (key && key[0] === '$') {
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
 * @param {object} entities Original object
 * @param {object} descriptor Update description
 * @returns {*}
 */
function updateObject(entities, descriptor) {

    if (!entities) {
        return entities;
    }

    let result = Array.isArray(entities) ? entities : [entities];

    if (!isUpdateDescriptor(descriptor)) {
        return descriptor && typeof descriptor === 'object'
            ? [util.copyMetaProperties(descriptor, result[0])]
            : result;
    }

    // get updater operations
    let operations = Object.keys(descriptor)
        .map(opType => ({name: opType, transformation: UPDATE_OPS[opType]}))
        .filter(op => op.transformation);

    for (let operator of operations) {
        result = mutate(result, descriptor[operator.name], operator.transformation);
    }

    return result;
}

/**
 * Mutates the object according to the transform logic.
 *
 * @param {object} entities Original entity object
 * @param {object} operationDescription Update descriptor
 * @param {function} transformation Transformator function
 * @returns {object}
 */
function mutate(entities, operationDescription, transformation) {
    if (!operationDescription) {
        return object;
    }

    return entities.map(item => {
        Object.keys(operationDescription)
            .forEach(key => transformation(item, key, operationDescription[key]));

        return item;
    });
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

    return Object.keys(descriptor).some(op => op in UPDATE_OPS);
}

/**
 * Determines whether the given selector matches exactly one element.
 *
 * @param {object} selector Selector object
 * @returns {boolean}
 */
function isSingleObjectSelector(selector) {
    return selector['_id'] && selector['_id'] !== 'object' && Object.keys(selector).length === 1;
}

module.exports = {
    stringify,
    updateObject,
    isSingleObjectSelector,
    isUpdateDescriptor
};
