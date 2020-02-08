all: test

integration:
	./node_modules/.bin/mocha test/integration_test

style:
	./node_modules/.bin/jscs ./src/**/*.js

.PHONY: test
