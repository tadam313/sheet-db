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
 * Tries to convert the value ro number. Since we can not decide
 * the type of the data coming back from the spreadsheet, we try to coerce it to number.
 * Finally we check the coerced value whether is equals to the original value. This check assure that the coercion
 * won't break anything. Note the 'weak equality' operator here is really important.
 *
 * @param {*} value
 * @returns {*}
 */
function coerceNumber(value) {
    var isfloat = /^\d*(\.|,)\d*$/;

    if (isfloat.test(value)) {
        value = value.replace(',', '.');
    }

    var numberValue = Number(value);
    return numberValue == value || !value ? numberValue : value
}

/**
 * Retrieves every field in the array of objects. These are collected in a Hash-map which means they are unique.
 *
 * @param {array} array Subject of the operation
 * @returns {array}
 */
function getArrayFields(array) {
    return (array || []).reduce(function(old, current) {
        arrayDiff(Object.keys(current), old)
            .forEach(function(key) {
                old.push(key);
            });

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

    return arrayTarget.filter(function(item) {
        return !~arrayCheck.indexOf(item);
    })
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
 * Creates variations of a specified function
 *
 * @param {array} versions Possible argument combination of the function
 * @param {function} subject Target function
 * @returns {function}
 */
function variations(versions, subject) {

    if (typeof subject !== 'function' || !(versions instanceof Array)) {
        return subject;
    }

    var matches = /\(([\w,\s]*)\)/.exec(subject.toString());

    if (!matches || matches.length < 2) {
        return subject;
    }

    var functionArguments = matches[1].split(',').map(function(item) {
        return item.trim();
    });

    return function() {
        var args = Array.prototype.slice.call(arguments);
        var newArgs = [];

        var version = versions.filter(function(version) {
            return version.length === args.length;
        });

        if (!version.length) {
            return subject.apply(this, arguments);
        }

        version = version[0];

        version.forEach(function(item, index) {
            var position = functionArguments.indexOf(item);
            newArgs[position] = args[index];
        });

        return subject.apply(this, newArgs);
    };
}

module.exports = util._extend(util, {
    isNaN: isNaN,
    coerceNumber: coerceNumber,
    getArrayFields: getArrayFields,
    arrayDiff: arrayDiff,
    createIdentifier: createIdentifier,
    variations: variations
});
