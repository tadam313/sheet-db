"use strict";

var util = require('util');

module.exports = {
    isNaN: function(value) {
        return !util.isNumber(value) || value != value;
    },

    convertValue: function(value) {
        if (!util.isString(value)) {
            value = value.tovalueing();
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
    }
};