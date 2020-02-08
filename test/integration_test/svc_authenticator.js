const jwt           = require('jsonwebtoken');
const request       = require('request');
const {promisify} = require('util');

const post = promisify(request.post);

module.exports.requestAccessToken = async (user, key) => {
    const authOptions = {
        iss: user,
        scope: 'https://spreadsheets.google.com/feeds',
        aud: 'https://www.googleapis.com/oauth2/v3/token',
        exp: Math.ceil(Date.now() / 1000) + 3600
    };

    const signature = jwt.sign(authOptions, key, {algorithm: 'RS256'});

    const response = await post({
        url: 'https://www.googleapis.com/oauth2/v3/token',
        headers: {
            accept: 'application/json'
        },
        form: {
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: signature
        }
    });

    return JSON.parse(response.body);
};
