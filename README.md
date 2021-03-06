[![Build Status](https://travis-ci.org/tadam313/sheet-db.svg?branch=master)](https://travis-ci.org/tadam313/sheet-db)

# sheet-db

The aim of the project is to provide a mongo like interface to Google Spreadsheets API. What is the point of Spreadsheets? It is a real quick and evident data solution, easy to view and share with any browser. In addition it keeps your managers happy since they love sheets, don't they?

Wait, Spreadsheets are not schema-less like mongo, right? It is true, however sheet-db hides all the nasty schema related things from you, all you need to care is the data itself, feel free to ignore the structure. Welcome to the NoSql world!

It supports single queries and also CRUD operations. Please consider that some operations (basically CRUD) require authorization. It is your responsibility to retrieve the access token and pass it to the package. Read more about [google authorization](https://developers.google.com/drive/web/about-auth).

__Note__: you can find example how to do a simple [service account authorization](https://developers.google.com/identity/protocols/OAuth2#serviceaccount) at [svc_authenticator](test/integration_test/svc_authenticator.js). You need to create a service account at google api console to get user email address and private key.

## Installation

```
npm install sheet-db
```

## Usage

Before you start, please make sure you are familiar with the terminology of Spreadsheets. Especially the differences and relations between sheets, worksheets and cells. Read more about [the terminology](https://developers.google.com/google-apps/spreadsheets/index).

First include the package and connect to the specific spreadsheets.

```
var connect = require('sheet-db');

// connect to <sheetID>, all subsequent requests will be public (unauthorized)
var sheet = connect('<sheetId>');

// connect to <sheetId> and set access token and additional options... Now you will communicate in authorized manner.
// Options
//  - token: access token you have got from Google
//  - version: this is the API version. This is for future use, only v3 is supported currently
var sheet = connect('<sheetId>', {token: '<token>', version: 'v3'});
```

### Working with sheets

Sheets are the highest level entities in Spreadsheets. You can query a specific sheet anytime, create or delete the worksheets.

```
// query info about the specific sheet (authors, worksheets)
var sheet = connect('<sheetId>');
sheet.info().then(...);

// create new sheet (requires authentication)
var sheet = connect('<sheetId>', {token: '<token>'});
sheet.createWorksheet('<sheetTitle>').then(...);

// drop a sheet (requires authentication)
var sheet = connect('<sheetId>', {token: '<token>'});
sheet.dropWorksheet('<sheetTitle>').then(...);
```

### Working with worksheets

First you need to retrieve a worksheet instance by title from the sheet. After you can interact with it.

```
// retrieve the specific worksheet
var sheet = connect('<sheetId>');
sheet.worksheet('<worksheetTitle>').then(function(worksheet) { ... });
```

Now you have the worksheet instance and here comes the good part.

You can **query** the worksheet. You could pass a [mongo like selector](http://docs.mongodb.org/manual/reference/operator/query/) object here. The interesting thing is that some parts of the selector will gets translated to Google Structured Query language. This means the performance is extremly good. Hmm, but it is limited, right? Yep, but don't worry, the unsupported selector operators will take effect on the client side, so finally you always get the data you requested.

```
// query the worksheet
var sheet = connect('<sheetId>');

sheet.worksheet('<worksheetTitle>').then(function(worksheet) {
    return Promise.all([
        // query everything
        worksheet.find(),

        // pass selector object
        worksheet.find({<mongo like selector>}),

        // pass selector and also options
        // Options:
        // - skip: number of entries skipped from the beginning of the result
        // - limit: limited length of the result
        // - sort: single property name, used to sort the data set
        // - descending: data set is sorted descending
        worksheet.find(
            {<mongo like selector>},
            {skip:<num>, limit:<num>, sort:'<fieldName>', descending:<bool>}
        )
    ]);
});
````

You can **insert** entries.

```
// create new entry in the worksheet
var sheet = connect('<sheetId>', {token: '<token>'});
sheet.worksheet('<worksheetTitle>').then(function(worksheet) {
    return Promise.all([
        // insert multiple entities
        worksheet.insert([{entity}, {entity}]),

        // insert a single entity
        worksheet.insert({entity})
    ]);
});
```

You can **update** entries with completely new object or [mongo update operators](http://docs.mongodb.org/manual/reference/operator/update/).

```
// update existing entry in the worksheet
var sheet = connect('<sheetId>', {token: '<token>'});
sheet.worksheet('<worksheetTitle>').then(function(worksheet) {
    return Promise.all([
        // simple update
        worksheet.update({<mongo like selector>}, {<new object or mongo updater>}),

        // pass options...
        // - multiple: update multiple entities (by default it updates only one, the first match)
        // - upsert: if entity is not found it creates new if the update parameter is NOT a mongo updater
        worksheet.update(
            {<mongo like selector>},
            {<new object or mongo updater>},
            {multiple:<boolean>, upsert:<boolean>}
        )
    ]);
});
```

**Removing** entries...

```
// delete existing entry in the worksheet
var sheet = connect('<sheetId>', {token: '<token>'});
sheet.worksheet('<worksheetTitle>').then(function(worksheet) {
    return Promise.all([
        // remove every entry in the worksheet
        worksheet.remove(),

        // remove selected entries in the worksheet
        worksheet.remove({<mongo like selector>}),

        // pass options...
        // - justOne: Delete only one entity (the first). It is false by default.
        worksheet.remove({<mongo like selector>}, {justOne:<boolean>})
    ]);
});
```

Every operation returns a promsie which is a [Promises/A+](https://promisesaplus.com/) compatible object.

## Contributing

If you have some new idea or just want to refactor existing features a bit, fell free to contribute.
Just fork the repository, do your modification and create a pull request.
I just want you to keep 2 things:

- code style (jscs included in the build flow and config should be changed for valid reasons)
- tests (please cover your code with unit tests)
