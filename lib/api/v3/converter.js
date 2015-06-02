'use strict';

var XmlWriter = require('xml-writer');
var dataUtil  = require('../../data_util');

var g = function(googleObject) {
    return dataUtil.coerceNumber(
        googleObject['$t']
    );
};

var createXMLWriter = function(extended) {
    extended = extended || false;

    var xw = new XmlWriter().startElement('entry')
        .writeAttribute('xmlns', 'http://www.w3.org/2005/Atom');

    return extended ?
        xw.writeAttribute(
            'xmlns:gsx',
            'http://schemas.google.com/spreadsheets/2006/extended'
        ) :
        xw.writeAttribute(
            'xmlns:gs',
            'http://schemas.google.com/spreadsheets/2006'
        );
};

/**
 * Gets the identifier from google api url. Usually this is tha last part of the URL.
 *
 * @param url
 * @returns {string}
 */
function getItemIdFromUrl(url) {
    return url.substr(url.lastIndexOf('/') + 1);
}

/**
 * Converts 'worksheet info' response to domain specific data.
 *
 * @param worksheet
 * @returns {{id: *, title, updated: Date, colCount, rowCount}}
 */
function worksheetData(worksheet) {
    return {
        worksheetId: getItemIdFromUrl(g(worksheet.id)),
        title: g(worksheet.title),
        updated: new Date(g(worksheet.updated)),
        colCount: g(worksheet['gs$colCount']),
        rowCount: g(worksheet['gs$rowCount'])
    };
}

/**
 * Converts 'get worksheet entry' response to domain specific data.
 *
 * @param entry
 * @param fieldPrefix
 * @returns {*}
 */
function worksheetEntry(entry, fieldPrefix) {
    fieldPrefix = fieldPrefix || 'gsx$';

    var data = {
        '$id': getItemIdFromUrl(g(entry.id)),
        '$updated': new Date(g(entry.updated))
    };

    Object.keys(entry)
        .filter(function(key) {
            return ~key.indexOf(fieldPrefix) && g(entry[key]);
        })
        .forEach(function(key) {
            var normalizedKey = key.substr(fieldPrefix.length);
            data[normalizedKey] = g(entry[key]);
        });

    return data;
}

/**
 * Converts 'sheet info' response to domain specific data.
 *
 * @param rawData
 * @returns {*}
 */
function sheetInfoResponse(rawData) {
    var feed = rawData.feed;

    return {
        title: g(feed.title),
        updated: new Date(g(feed.updated)),
        workSheets: feed.entry.map(worksheetData),
        authors: feed.author.map(function(item) {
            return {
                name: g(item.name),
                email: g(item.email)
            };
        })
    };
}

/**
 * Converts the query results to domain specific data.
 *
 * @param rawData
 * @returns {*}
 */
function queryResponse(rawData) {
    var entry = rawData.feed.entry || [];
    return entry.map(function(item) {
        return worksheetEntry(item);
    });
}

/**
 * Converts field names query response, used by schema operations
 *
 * @param rawData
 */
function queryFieldNames(rawData) {
    var entry = rawData.feed.entry || [];
    return entry.map(function(item) {
        return worksheetEntry(item, 'gs$');
    });
}

/**
 * Creates worksheet request payload.
 *
 * @param options
 * @returns {*}
 */
function createWorksheetRequest(options) {
    options = options || {};

    var rowCount = dataUtil.coerceNumber(options.rowCount || 10);
    var colCount = dataUtil.coerceNumber(options.colCount || 10);

    options.rowCount = Math.max(rowCount, 10);
    options.colCount = Math.max(colCount, 10);

    var xw = createXMLWriter()
        .startElement('title')
        .text(options.title)
        .endElement()
        .startElement('gs:rowCount')
        .text(options.rowCount)
        .endElement()
        .startElement('gs:colCount')
        .text(options.colCount)
        .endElement()
        .endElement();

    return xw.toString();
}

/**
 * Creates 'create entry' request payload.
 *
 * @param entry
 * @returns {*}
 */
function createEntryRequest(entry) {
    var xw = createXMLWriter(true);

    Object.keys(entry).forEach(function(key) {
        xw = xw.startElement('gsx:' + key)
                .text(dataUtil.coerceNumber(entry[key]))
            .endElement();
    });

    return xw.endElement().toString();
}
/**
 * Creates the 'create column' request payload
 *
 * @param columnName
 * @param position
 *
 * @returns {*}
 */
function createFieldRequest(columnName, position) {

    if (dataUtil.isNaN(position) || position <= 0) {
        throw new TypeError('Position should be a number which is higher than one!');
    }

    var xw = createXMLWriter();

    xw = xw.startElement('gs:cell')
        .writeAttribute('row', 1)
        .writeAttribute('col', position)
        .writeAttribute('inputValue', columnName)
        .endElement();

    return xw.endElement().toString();
}

module.exports = {
    queryFieldNames: queryFieldNames,
    queryResponse: queryResponse,
    sheetInfoResponse: sheetInfoResponse,

    createFieldRequest: createFieldRequest,
    createEntryRequest: createEntryRequest,
    createWorksheetRequest: createWorksheetRequest
};
