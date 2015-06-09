
'use strict';

var jwt     = require('jsonwebtoken');
var request = require('request');
var prompt = require('prompt');

function requestToken(user, key) {
    key = key.replace(/\\n/g, '\n').replace(/\\u([\d\w]{4})/gi, function(match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });

    var authOptions = {
        'iss': user + '@developer.gserviceaccount.com',
        'scope':'https://spreadsheets.google.com/feeds',
        'aud':'https://www.googleapis.com/oauth2/v3/token',
        'exp': Math.ceil(Date.now() / 1000) + 3600
    };

    var signature = jwt.sign(authOptions, key, {
        algorithm: 'RS256'
    });

    request.post({
        url: 'https://www.googleapis.com/oauth2/v3/token',
        form: {
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion': signature
        }
    }, function(err, response, body) {
        console.log('\n============================ ACCESS_TOKEN ===========================\n');
        console.log(body);
    });
}

if (!process.env.USER_ID && !process.env.PRIVATE_KEY) {

    var schema = {
        properties: {
            user: {
                description: 'Please type your USER_ID',
                type: 'string',
                required: true
            },
            key: {
                description: 'Please type your PRIVATE_KEY',
                type: 'string',
                required: true,
                hidden: true
            }
        }
    };

    prompt.start();
    prompt.get(schema, function(err, result) {
        if (err) {
            return;
        }

        requestToken(result.user, result.key);
    });
} else {
    requestToken(process.env.USER_ID, process.env.PRIVATE_KEY);
}
