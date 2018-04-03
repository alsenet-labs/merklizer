.PHONY: webapp cordova run run-webapp run-cordova

all: webapp cordova

webapp:
	cd webapp && yarn && gulp build

cordova:
	cd cordova && yarn && ( test -d platforms/android || cordova platform add android ) && ( test -d platforms/browser  || cordova platform add browser ) && gulp build

run: run-cordova

run-cordova: cordova
	cd cordova && gulp run

run-webapp: webapp
	cd webapp && gulp run


