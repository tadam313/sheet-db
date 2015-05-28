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
            worksheetId: this.getItemIdFromUrl(g(worksheet.id)),
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
     * @param fieldPrefix
     * @returns {*}
     */
    worksheetEntry: function(entry, fieldPrefix) {
        fieldPrefix = fieldPrefix || 'gsx$';

        var data = {
            '$id': this.getItemIdFromUrl(g(entry.id)),
            '$updated': new Date(g(entry.updated))
        };

        Object.keys(entry)
            .filter(function(key) { return key.indexOf(fieldPrefix) === 0; })
            .forEach(function(key) {
                var normalizedKey = key.substr(fieldPrefix.length);
                data[normalizedKey] = g(entry[key]);
            });

        return data;
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
            workSheets: feed.entry.map(this.worksheetData, this),
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

        Object.keys(entry).forEach(function(key) {
            xw = xw.startElement('gsx:' + key).text(entry[key]).endElement();
        });

        return xw.endElement().toString();
    },

    /**
     * Converts the result of entry creation
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
        return entry.map(function(item) {
            return this.worksheetEntry(item);
        }, this);
    },

    /**
     * Converts field names query response, used by schema operations
     *
     * @param rawData
     */
    queryFieldNames: function(rawData) {
        rawData = this.convertGeneric(rawData);

        var entry = rawData.feed.entry || [];
        return entry.map(function(item) { return this.worksheetEntry(item, 'gs$'); }, this);
    },

    /**
     * Creates the 'create column' request payload
     *
     * @param columnName
     * @param position
     *
     * @returns {*}
     */
    createFieldRequest: function(columnName, position) {
        var xw = createXMLWriter();

        xw = xw.startElement('gs:cell')
                .writeAttribute('row', 1)
                .writeAttribute('col', position)
                .writeAttribute('inputValue', columnName)
            .endElement();

        return xw.endElement().toString();
    }
};
