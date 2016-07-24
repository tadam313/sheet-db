'use strict';

var jwt     = require('jsonwebtoken');
var request = require('request');
var assert  = require('assert');
var connect = require('../../');

function formatKey(key) {
    return key.replace(/\\n/g, '\n').replace(/\\u([\d\w]{4})/gi, function(match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });
}

function requestAccessToken(user, key) {
        key = formatKey(key);

    var authOptions = {
        iss: user + '@developer.gserviceaccount.com',
        scope: 'https://spreadsheets.google.com/feeds',
        aud: 'https://www.googleapis.com/oauth2/v3/token',
        exp: Math.ceil(Date.now() / 1000) + 3600
    };

    var signature = jwt.sign(authOptions, key, {algorithm: 'RS256'});

    return new Promise(function(resolve, reject) {
        request.post({
            url: 'https://www.googleapis.com/oauth2/v3/token',
            headers: {
                accept: 'application/json'
            },
            form: {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: signature
            }
        }, function(err, response, body) {
            if (err) {
                return reject(err);
            }

            resolve(JSON.parse(body));
        })
    });
}

module.exports = function*() {
    assert(process.env.USER, 'Please specify the acting user for the tests');
    assert(process.env.KEY, 'Please specify your private key for the tests');
    assert(process.env.SHEET, 'Please specify a sandbox sheet for the tests');

    let tokenResponse = yield requestAccessToken(process.env.USER, process.env.KEY);
    return connect(process.env.SHEET, {token: tokenResponse.access_token});
};
