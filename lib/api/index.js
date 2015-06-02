
var apis = [{
    id: 'v3',
    api: require('./v3')
}];

/**
 *
 * @returns {Array}
 */
function getSupportedVersions() {
    return apis.map(function(item) {
        return item.id;
    });
}

/**
 *
 * @param version
 * @returns {{id: string, api: exports}}
 */
function getApi(version) {
    var candidates = apis.filter(function(item) {
        return item.id === version;
    });

    if (!candidates.length) {
        throw new Error('This API version is not supported! Supported versions are: ' +
        this.getSupportedVersions().join());
    }

    return candidates[0].api;
}

module.exports = {
    getSupportedVersions: getSupportedVersions,
    getApi: getApi
};