
var apis = [{
    id: 'v3',
    api: require('./v3')
}];

/**
 *
 * @returns {Array}
 */
function getSupportedVersions() {
    return apis.map(api => api.id);
}

/**
 *
 * @param {String} version
 * @returns {{id: string, api: exports}}
 */
function getApi(version='v3') {
    var candidates = apis.filter((item) => item.id === version);

    if (!candidates.length) {
        throw new Error('This API version is not supported! Supported versions are: ' +
        this.getSupportedVersions().join());
    }

    return candidates[0].api;
}

module.exports = {
    getSupportedVersions,
    getApi
};
