test:
	./node_modules/.bin/mocha test --reporter spec && jscs ./**/*.js

.PHONY: test
