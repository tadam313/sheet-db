"use strict";

var XmlWriter = require('xml-writer');

var g = function(google_object) {
    return google_object['$t'];
};

var createXMLWriter = function(extended) {
    extended = extended || false;

    var xw = new XmlWriter().startElement('entry')
            .writeAttribute('xmlns', 'http://www.w3.org/2005/Atom');

    return extended
        ? xw.writeAttribute('xmlns:gsx', 'http://schemas.google.com/spreadsheets/2006/extended')
        : xw.writeAttribute('xmlns:gs', 'http://schemas.google.com/spreadsheets/2006');
};

module.exports = {

    /**
     * Converts a generic response to model specific data
     *
     * @param response
     * @returns {*}
     */
    convertGeneric: function(response) {
        try {
            return JSON.parse(response);
        } catch (err) {
            return response;
        }
    },

    /**
     * Gets the identifier from google api url. Usually this is tha last part of the URL.
     *
     * @param url
     * @returns {string}
     */
    getItemIdFromUrl: function(url) {
        return url.substr(url.lastIndexOf('/') + 1);
    },

    /**
     * Converts 'worksheet info' response to domain specific data.
     *
     * @param worksheet
     * @returns {{id: *, title, updated: Date, colCount, rowCount}}
     */
    worksheetData: function(worksheet) {
        return {
            id: this.getItemIdFromUrl(g(worksheet.id)),
            title: g(worksheet.title),
            updated: new Date(g(worksheet.updated)),
            colCount: g(worksheet['gs$colCount']),
            rowCount: g(worksheet['gs$rowCount'])
        };
    },

    /**
     * Converts 'get worksheet entry' response to domain specific data.
     *
     * @param entry
     * @returns {*}
     */
    worksheetEntry: function(entry) {
        var sheetLine = {
            '$id': this.getItemIdFromUrl(g(entry.id)),
            '$updated': new Date(g(entry.updated))
        };

        for (var key in entry) {
            if (entry.hasOwnProperty(key) && key.indexOf('gsx$') == 0) {
                var normalizedKey = key.substr(4);
                sheetLine[normalizedKey] = g(entry[key]);
            }
        }

        return sheetLine;
    },

    /**
     * Converts 'sheet info' response to domain specific data.
     *
     * @param rawData
     * @returns {*}
     */
    sheetInfoResponse: function(rawData) {
        rawData = this.convertGeneric(rawData);

        var feed = rawData.feed;

        return {
            title: g(feed.title),
            updated: new Date(g(feed.updated)),
            workSheets: feed.entry.map(this.worksheetData.bind(this)),
            authors: feed.author.map(function (item) {
                return { name: g(item.name), email: g(item.email) };
            })
        };
    },

    /**
     * Converts 'create worksheet' response to domain specific data.
     *
     * @param rawData
     * @returns {*}
     */
    createWorksheetResponse: function(rawData) {
        if (!rawData)
            return null;

        var entry = rawData.entry;
        return this.worksheetData(entry);
    },

    /**
     * Creates worksheet request payload.
     *
     * @param options
     * @returns {*}
     */
    createWorksheetRequest: function(options) {
        options = options || {};
        options.rowCount = options.rowCount || 50;
        options.colCount = options.colCount || 10;

        var xw = createXMLWriter()
                .startElement('title').text(options.title).endElement()
                    .startElement('gs:rowCount').text(options.rowCount).endElement()
                    .startElement('gs:colCount').text(options.colCount).endElement()
            .endElement();

        return xw.toString();
    },

    /**
     * Creates 'create entry' request payload.
     *
     * @param entry
     * @returns {*}
     */
    createEntryRequest: function(entry) {
        entry = this.convertGeneric(entry);

        var xw = createXMLWriter(true);

        for (var key in entry) {
            if (entry.hasOwnProperty(key)) {
                xw = xw.startElement('gsx:' + key).text(entry[key]).endElement();
            }
        }

        return xw.endElement().toString();
    },

    /**
     *
     * @param rawData
     * @returns {*}
     */
    createEntryResponse: function(rawData) {
        rawData = this.convertGeneric(rawData);

        return this.worksheetEntry(rawData.entry);
    },

    /**
     * Converts the query results to domain specific data.
     *
     * @param rawData
     * @returns {*}
     */
    queryResponse: function(rawData) {
        rawData = this.convertGeneric(rawData);

        var entry = rawData.feed.entry || [];
        return entry.map(this.worksheetEntry.bind(this));
    }
};
