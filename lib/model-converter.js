
var XmlWriter = require('xml-writer');

var g = function (google_object) {
    return google_object['$t'];
};

module.exports = {

    getWorksheetIdFromUrl: function (url) {
        return url.substr(url.lastIndexOf('/') + 1);
    },

    fromWorksheetData: function (worksheet) {
        return {
            id: this.getWorksheetIdFromUrl(g(worksheet.id)),
            title: g(worksheet.title),
            updated: new Date(g(worksheet.updated)),
            colCount: g(worksheet['gs$colCount']),
            rowCount: g(worksheet['gs$rowCount'])
        };
    },

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

            workSheets: feed.entry.map(this.fromWorksheetData.bind(this))
        };
    },

    fromCreateWorkSheet: function (rawData) {
        if (!rawData)
            return null;

        var entry = rawData.entry;

        return this.fromWorksheetData(entry);
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
