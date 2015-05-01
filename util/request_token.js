
var jwt     = require('jsonwebtoken'),
    request = require('request');

if (!process.argv[2]) {
  throw new Error('UserId is required');
}

if (!process.argv[3]) {
  throw new Error('Auth key is required');
}

var user = process.argv[2];
var key = process.argv[3].replace(/\\n/g, '\n').replace(/\\u([\d\w]{4})/gi, function(match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
});

var authOptions = {
  "iss": user + '@developer.gserviceaccount.com',
  "scope":"https://spreadsheets.google.com/feeds",
  "aud":"https://www.googleapis.com/oauth2/v3/token",
  "exp": Math.ceil(Date.now() / 1000) + 3600
};

var signature = jwt.sign(authOptions, key, {
    algorithm: 'RS256'
});

request.post({
    url: 'https://www.googleapis.com/oauth2/v3/token',
    form: {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signature
    }
}, function(err, response, body) {
    console.log('\n============================ ACCESS_TOKEN ===========================\n');
    console.log(body);
});
