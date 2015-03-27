
var XmlWriter = require('xml-writer');

var g = function (google_object) {
    return google_object['$t'];
};

var createXMLWriter = function (extended) {
    extended = extended || false;

    var xw = new XmlWriter().startElement('entry')
            .writeAttribute('xmlns', 'http://www.w3.org/2005/Atom');

    return extended
        ? xw.writeAttribute('xmlns:gsx', 'http://schemas.google.com/spreadsheets/2006/extended')
        : xw.writeAttribute('xmlns:gs', 'http://schemas.google.com/spreadsheets/2006');
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
        options = options || {};
        options.rowCount = options.rowCount || 50;
        options.colCount = options.colCount || 10;

        var xw = createXMLWriter()
                .startElement('title').text(title).endElement()
                    .startElement('gs:rowCount').text(options.rowCount).endElement()
                    .startElement('gs:colCount').text(options.colCount).endElement()
            .endElement();

        return xw.toString();
    },

    fromDropWorksheet: function (rawData) {
        if (!rawData)
            return null;

        console.log(rawData);
    },

    toCreateEntry: function (line) {
        if (!line)
            return null;

        var xw = createXMLWriter(true);

        for (var key in line) {
            if (line.hasOwnProperty(key)) {
                xw = xw.startElement('gsx:' + key).text(line[key]).endElement();
            }
        }

        return xw.endElement().toString();
    },

    fromCreateEntry: function (rawData) {
        return null;
    }
};
