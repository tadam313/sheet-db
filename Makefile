all: test style

test:
	./node_modules/.bin/mocha test --compilers js:babel-core/register --reporter spec

compile:
	./node_modules/.bin/babel --presets es2015,stage-0 -d lib/ src/

style:
	./node_modules/.bin/jscs ./src/**/*.js

.PHONY: test style compile
