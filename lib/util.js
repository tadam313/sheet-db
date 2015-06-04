'use strict';

var util = require('util');

/**
 *
 * @param value
 * @returns {boolean}
 */
function isNaN(value) {
    return typeof value !== 'number' || value != value;
}

/**
 * Tries to convert the value in the "most appropriate" form. Since we can not decide
 * the type of the data coming back from the spreadsheet data, we try to coerce it to number.
 *
 * @param value
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
 * @param array
 * @returns {*}
 */
function getArrayFields(array) {
    var _this = this;

    return (array || []).reduce(function(old, current) {
        _this.arrayDiff(Object.keys(current), old)
            .forEach(function(key) {
                old.push(key);
            });

        return old;
    }, []);
}

/**
 * Determines which elements from arrayTarget are not present in arrayCheck.
 *
 * @param arrayTarget
 * @param arrayCheck
 * @returns {*}
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
 */
function createIdentifier() {
    return Array.prototype.slice.call(arguments).join('_');
}

/**
 * Creates variations of a specified function
 *
 * @param versions - possible arguments of the function
 * @param subject - target function
 * @returns {Function}
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

        var version = versions.filter(function(version) {
            return version.length === args.length;
        });

        if (!version.length) {
            return subject.apply(this, arguments);
        }

        version = version[0];

        var newArgs = [];

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
