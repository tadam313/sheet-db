'use strict';

const assert        = require('assert');
const connect       = require('../../');
const authenticator = require('./svc_authenticator');

function formatKey(key) {
    return key.replace(/\\n/g, '\n').replace(/\\u([\d\w]{4})/gi,
        (match, grp) => String.fromCharCode(parseInt(grp, 16))
    );
}

module.exports = async () => {
    assert(process.env.USER, 'Please specify the acting user for the tests');
    assert(process.env.KEY, 'Please specify your private key for the tests');
    assert(process.env.SHEET, 'Please specify a sandbox sheet for the tests');

    const key = formatKey(process.env.KEY);
    let tokenResponse = await authenticator.requestAccessToken(process.env.USER, key);
    return connect(process.env.SHEET, {token: tokenResponse.access_token});
};
