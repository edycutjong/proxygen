# Makefile for Proxygen Mono-repo

.PHONY: install test test-coverage typecheck lint build ci

install:
	cd agent && npm install
	cd dashboard && npm install

test:
	cd agent && npm run test
	cd dashboard && npm run test

test-coverage:
	cd agent && npm run test -- --coverage
	cd dashboard && npm run test:coverage

typecheck:
	cd agent && npm run typecheck
	cd dashboard && npm run typecheck

lint:
	cd dashboard && npm run lint

build:
	cd agent && npm run build
	cd dashboard && npm run build

ci: install typecheck lint test-coverage build
