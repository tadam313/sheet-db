
var g = function (google_object) {
    return google_object['$t'];
};

module.exports = {

    fromSheetInfo: function (rawData) {
        var feed = rawData.feed;

        return {
            title: g(feed.title),

            authors: feed.author.map(function (item) {
                return {
                    name: g(item.name),
                    email: g(item.email)
                }
            }),

            updated: new Date(g(feed.updated)),

            sheets: feed.entry.map(function (item) {
                return {
                    title: g(item.title),
                    updated: new Date(g(item.updated)),
                    colCount: g(item['gs$colCount']),
                    rowCount: g(item['gs$rowCount'])
                };
            })
        };
    }
};