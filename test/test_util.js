var chai = require('chai');
var sinon = require('sinon');
var chaiXml = require('chai-xml');

var expect = chai.expect;
chai.use(chaiXml);

/**
 * Run given testcases on the subject. The tests automatically use fake time.
 *
 * @param {array} testCases Data provider for the tests
 * @param {function} subject Given function to feed with testcases
 */
function runTests(testCases, subject) {

    if (!(testCases instanceof Array)) {
        throw new TypeError('Testcases should be an array');
    }

    testCases.forEach(function(testCase) {
        it(testCase.name, function() {
            var clock = sinon.useFakeTimers();
            var result = subject.apply({},
                testCase.data instanceof Array ? testCase.data : [testCase.data]
            );

            if (testCase.matches) {
                expect(result).to.match(testCase.matches);
            } else if (testCase.expected) {
                expect(result).to.eql(testCase.expected);
            }

            clock.restore();
        });
    });
}

/**
 * Checks whether xml payload is valid and and assert it against the expected.
 *
 * @param {string} expected Expected XML payload.
 * @param {string} payload Actual payload.
 * @param {boolean} extendedSchema Google sometimes requires different schemas
 */
function assertXMLPayload(expected, payload, extendedSchema) {
    expect(payload).xml.to.be.valid();
    expect(payload).xml.to.equal(
        '<entry xmlns="http://www.w3.org/2005/Atom" ' +
        (extendedSchema ?
            'xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended"' :
            'xmlns:gs="http://schemas.google.com/spreadsheets/2006"'
        ) + '>' + expected +
        '</entry>'
    );
}

/**
 * No-op function, usefull at callbacks when we need to pass argument but we don't care about the result
 */
function identFunc() {}

/**
 *
 *
 * @param stubDependency
 * @param functionInvoker
 */
function assertFuncReportsError(stubDependency, functionInvoker) {
    var spy = sinon.spy();
    var err = new Error('test');

    if (typeof functionInvoker !== 'function') {
        throw new TypeError('functionInvoker should be function (strategy pattern)');
    }

    // make outer dependency yielding error back
    stubDependency.yields(err);

    functionInvoker(spy);
    expect(spy).to.have.been.calledWithExactly(err);
}

module.exports = {
    runTests: runTests,
    assertXMLPayload: assertXMLPayload,
    identFunc: identFunc,
    assertFuncReportsError: assertFuncReportsError
};
