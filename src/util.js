'use strict';

var util = require('util');

/**
 * Checks whether the specified values is not a number. Built-in function coerce the value to number first
 * which could be misleading sometimes.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isNaN(value) {
    return typeof value !== 'number' || value != value;
}

/**
 * Tries to convert the value to number. Since we can not decide
 * the type of the data coming back from the spreadsheet, we try to coerce it to number.
 * Finally we check the coerced value whether is equals to the original value. This check assure that the coercion
 * won't break anything. Note the 'weak equality' operator here is really important.
 *
 * @param {*} value
 * @returns {*}
 */
function coerceNumber(value) {
    if (typeof value === 'number') {
        return value;
    }

    let isfloat = /^\d*(\.|,)\d*$/;

    if (isfloat.test(value)) {
        value = value.replace(',', '.');
    }

    let numberValue = Number(value);
    return numberValue == value || !value ? numberValue : value
}

/**
 * Tries to convert the value to Date. First it try to parse it and if it gets a number,
 * the Date constructor will be fed with that.
 *
 * @param {*} value
 * @returns {*}
 */
function coerceDate(value) {
    if (value instanceof Date) {
        return value;
    }

    let timestamp = Date.parse(value);

    if (!isNaN(timestamp)) {
        return new Date(timestamp);
    }

    return value;
}

/**
 * We can not decide the type of the data coming back from the spreadsheet,
 * we try to coerce it to Date or Number. If both "failes" it will leave the value unchanged.
 *
 * @param {*} value
 * @returns {*}
 */
function coerceValue(value) {

    let numValue = coerceNumber(value);

    if (numValue === value) {
        return coerceDate(value);
    }

    return numValue;
}

/**
 * Retrieves every field in the array of objects. These are collected in a Hash-map which means they are unique.
 *
 * @param {array} array Subject of the operation
 * @returns {array}
 */
function getArrayFields(array) {
    return (array || []).reduce((old, current) => {
        arrayDiff(Object.keys(current), old)
            .forEach(key => old.push(key));

        return old;
    }, []);
}

/**
 * Determines which elements from arrayTarget are not present in arrayCheck.
 *
 * @param {array} arrayTarget Target of the check
 * @param {array} arrayCheck Subject of the check
 * @returns {array}
 */
function arrayDiff(arrayTarget, arrayCheck) {
    if (!(arrayTarget instanceof Array) || !(arrayCheck instanceof Array)) {
        throw new Error('Both objects have to be an array');
    }

    return arrayTarget.filter(item => !~arrayCheck.indexOf(item));
}

/**
 * Simply construct a string from the arguments by joining them
 *
 * @returns {string}
 */
function createIdentifier() {
    return Array.prototype.slice.call(arguments).join('_');
}

/**
 * Grab meta google drive meta properties from source and add those to dest.
 *
 * @param dest
 * @param source
 */
function copyMetaProperties(dest, source) {
    if (!dest || !source) {
        return dest;
    }

    let fields = ['_id', '_updated'];

    for (let field of fields) {
        dest[field] = source[field];
    }

    return dest;
}

module.exports = util._extend(util, {
    isNaN,
    coerceNumber,
    coerceDate,
    coerceValue,
    getArrayFields,
    arrayDiff,
    createIdentifier,
    copyMetaProperties
});
