# @Last modified time: 2018-04-04T12:02:57+07:00

.PHONY: webapp cordova run run-webapp run-cordova run-cordova-android

all: webapp cordova

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
