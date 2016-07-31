all: test style

watch:
	./node_modules/.bin/nodemon --watch src/ --exec "./node_modules/.bin/babel --presets es2015,stage-0 -d lib/ src/"

test: compile
	./node_modules/.bin/istanbul cover --report text --report lcov ./node_modules/.bin/_mocha "test/unit_test/**/*.spec.js"

integration: compile
	./node_modules/.bin/mocha test/integration_test

send-coverage:
	./node_modules/.bin/codeclimate-test-reporter < coverage/lcov.info

test-coverage: test send-coverage

compile:
	./node_modules/.bin/babel --presets es2015,stage-0 -d lib/ src/

style:
	./node_modules/.bin/jscs ./src/**/*.js

.PHONY: test
