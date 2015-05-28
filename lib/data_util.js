"use strict";

var util = require('util');

module.exports = {
    isNaN: function(value) {
        return !util.isNumber(value) || value != value;
    },

    convertValue: function(value) {
        if (!util.isString(value)) {
            value = value.toString();
        }

        var isInt = /^\d+$/;
        var isfloat = /^\d*(\.|,)\d*$/;

        var guessedValue = value;

        if (isfloat.test(value)) {
            value = value.replace(',', '.');
            guessedValue = parseFloat(value);
        }

        if (this.isNaN(guessedValue) || isInt.test(value)) {
            guessedValue = parseInt(value);
        }

        return guessedValue == value ? guessedValue : value
    },

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

    arrayDiff: function(arrayTarget, arrayCheck) {
        if (!util.isArray(arrayTarget) || !util.isArray(arrayCheck)) {
            throw new Error('Both objects have to be an array');
        }

        return arrayTarget.filter(function(item) {
            return !~arrayCheck.indexOf(item);
        })
    }
};