all: test style

watch:
	./node_modules/.bin/nodemon --watch src/ --exec "./node_modules/.bin/babel --presets es2015,stage-0 -d lib/ src/"

test: compile
	./node_modules/.bin/mocha test/unit_test

integration: compile
	./node_modules/.bin/mocha test/integration_test

compile:
	./node_modules/.bin/babel --presets es2015,stage-0 -d lib/ src/

style:
	./node_modules/.bin/jscs ./src/**/*.js

.PHONY: test style
