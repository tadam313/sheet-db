'use strict';

var util      = require('../../util');
var XmlWriter = require('xml-writer');

/**
 * Just pick $t property from an object
 *
 * @param feedObject
 * @param disableCoercion
 * @returns {*}
 */
var g = function(feedObject, disableCoercion) {

    if (disableCoercion) {
        return feedObject['$t'];
    }

    return util.coerceValue(feedObject['$t']);
};

/**
 * Creates XML writer for the data.
 *
 * @param extended
 * @returns {*}
 */
function createXMLWriter(extended) {
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
}

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
 * Transforms query request object
 *
 * @param queryOptions
 * @returns {*}
 */
function queryRequest(queryOptions) {

    if (!queryOptions) {
        return;
    }

    var options = util._extend({}, queryOptions);

    if (options.query && options.query.length) {
        options.query = '&sq=' + encodeURIComponent(options.query);
    }

    if (options.sort) {
        options.orderBy = '&orderby=column:' + options.sort;
        delete options.sort;
    }

    if (options.descending) {
        options.reverse = '&reverse=true';
        delete options.descending;
    }

    return options;
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
        updated: g(worksheet.updated),
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
        '_id': getItemIdFromUrl(g(entry.id)),
        '_updated': g(entry.updated)
    };

    Object.keys(entry)
        .filter(function(key) {
            return ~key.indexOf(fieldPrefix) && g(entry[key], true);
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
        updated: g(feed.updated),
        workSheets: feed.entry.map(worksheetData),
        authors: feed.author.map(item => ({name: g(item.name), email: g(item.email)}))
    };
}

/**
 * Converts create worksheet result to domain specific data.
 *
 * @param rawData
 * @returns {*}
 */
function workSheetInfoResponse(rawData) {

    if (typeof rawData === 'string') {
        rawData = JSON.parse(rawData);
    }

    return worksheetData(rawData.entry);
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
        var field = worksheetEntry(item, 'gs$');
        field.cell = field.cell.replace(/_/g, '');
        return field;
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

    // TODO: needs to handle overflow cases and create ore dynamically
    var rowCount = util.coerceNumber(options.rowCount || 5000);
    var colCount = util.coerceNumber(options.colCount || 50);

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
            .text(util.coerceNumber(entry[key]).toString())
            .endElement();
    });

    return xw.endElement().toString();
}

/**
 * Creates an 'update entry' request payload
 *
 * @param entry
 * @returns {*}
 */
function updateEntryRequest(entry) {
    var xw = createXMLWriter(true);

    Object.keys(entry)
        .filter(function(key) {
            // filter out internal properties
            return key.indexOf('_') !== 0;
        })
        .forEach(function(key) {
            xw = xw.startElement('gsx:' + key)
                .text(util.coerceNumber(entry[key]).toString())
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

    if (util.isNaN(position) || position <= 0) {
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
    queryFieldNames,
    queryRequest,
    queryResponse,
    sheetInfoResponse,
    workSheetInfoResponse,

    createFieldRequest,
    createEntryRequest,
    createWorksheetRequest,
    updateEntryRequest
};
