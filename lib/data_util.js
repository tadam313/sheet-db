'use strict';

var util = require('util');

module.exports = {
    /**
     *
     * @param value
     * @returns {boolean}
     */
    isNaN: function(value) {
        return !util.isNumber(value) || value != value;
    },

    /**
     * Tries to convert the value in the "most appropriate" form. Since we can not decide
     * the type of the data coming back from the spreadsheet data, we try to coerce it to number.
     *
     * @param value
     * @returns {*}
     */
    coerceNumber: function(value) {
        var isfloat = /^\d*(\.|,)\d*$/;

        if (isfloat.test(value)) {
            value = value.replace(',', '.');
        }

        var numberValue = Number(value);
        return numberValue == value || !value ? numberValue : value
    },

    /**
     * Retrieves every field in the array of objects. These are collected in a Hash-map which means they are unique.
     *
     * @param array
     * @returns {*}
     */
    getArrayFields: function(array) {
        var _this = this;

        return (array || []).reduce(function(old, current) {
            _this.arrayDiff(Object.keys(current), old)
                .forEach(function(key) {
                    old.push(key);
                });

            return old;
        }, []);
    },

    /**
     * Determines which elements from arrayTarget are not present in arrayCheck.
     *
     * @param arrayTarget
     * @param arrayCheck
     * @returns {*|Array.<T>}
     */
    arrayDiff: function(arrayTarget, arrayCheck) {
        if (!util.isArray(arrayTarget) || !util.isArray(arrayCheck)) {
            throw new Error('Both objects have to be an array');
        }

        return arrayTarget.filter(function(item) {
            return !~arrayCheck.indexOf(item);
        })
    },

    /**
     * Simply construct a string from the arguments by joining them
     *
     */
    createIdentifier: function() {
        return Array.prototype.slice.call(arguments).join('_');
    }
};
