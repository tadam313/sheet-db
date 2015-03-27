
var XmlWriter = require('xml-writer');

var g = function (google_object) {
    return google_object['$t'];
};

module.exports = {

    fromSheetInfo: function (rawData) {
        if (!rawData)
            return null;

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
    },

    fromCreateWorkSheet: function (rawData) {
        if (!rawData)
            return null;

        var entry = rawData.entry;

        return {
            title: g(entry.title),
            colCount: g(entry['gs$colCount']),
            rowCount: g(entry['gs$rowCount'])
        };
    },

    toCreateWorkSheet: function (title, options) {
        var xw = new XmlWriter();

        options = options || {};
        options.rowCount = options.rowCount || 50;
        options.colCount = options.colCount || 10;

        xw = xw.startElement('entry')
            .writeAttribute('xmlns', 'http://www.w3.org/2005/Atom')
            .writeAttribute('xmlns:gs', 'http://schemas.google.com/spreadsheets/2006')
                .startElement('title').text(title).endElement()
                    .startElement('gs:rowCount').text(options.rowCount).endElement()
                    .startElement('gs:colCount').text(options.colCount).endElement()
            .endElement();

        return xw.toString();
    }
};
