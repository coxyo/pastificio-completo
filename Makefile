.PHONY: test test-frontend test-backend

test-frontend:
	cd pastificio-frontend-final && npm run test:ci

test-backend:
	cd pastificio-backend && npm run test:ci

test-all: test-frontend test-backend

install:
	cd pastificio-frontend-final && npm ci
	cd pastificio-backend && npm ci 
