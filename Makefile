build:
	npm run compile
	vsce package

publish:
	vsce publish