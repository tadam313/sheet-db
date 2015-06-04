var expect = require('chai').expect;
var sinon = require('sinon');

/**
 * Run given testcases on the subject
 *
 * @param testCases
 * @param subject
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

            expect(result).to.deep.equal(testCase.expected);
            clock.restore();
        });
    });
}

module.exports = {
    runTests: runTests
};
