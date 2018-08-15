# @Last modified time: 2018-08-15T13:25:35+07:00

.PHONY: webapp cordova run run-webapp run-cordova run-cordova-android

all: webapp cordova

gh-pages: webapp-ugly
	yarn && gulp update-ghpages

ugly: webapp-ugly cordova

webapp:
	cd webapp && yarn && gulp build

webapp-ugly:
	cd webapp && yarn && gulp build-ugly

cordova:
	cd cordova && yarn && ( test -d platforms/android || cordova platform add android ) && ( test -d platforms/browser  || cordova platform add browser ) && gulp build

run: run-cordova

run-cordova: cordova
	cd cordova && cordova run browser

run-cordova-android: cordova
	cd cordova && cordova run android

run-webapp: webapp
	cd webapp && gulp run
