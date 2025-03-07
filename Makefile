build:
	npm run compile
	vsce package

publish:
	vsce publish

install_deps:
	npm install -g vsce
	vsce --version 