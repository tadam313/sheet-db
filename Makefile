test:
	./node_modules/.bin/mocha test --reporter spec && jscs ./src/**/*.js

.PHONY: test
