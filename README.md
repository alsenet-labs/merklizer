# merklizer
Web app for computing Merkle trees and anchoring hashes to the open public blockchains

__Under active development, don't use it for production yet.__

## Copyright
 Copyright (c) 2018-2019 ALSENET SA

## Authors
  * Alexandre Poltorak <polto@alsenet.com>
  * Luc Deschenaux <luc.deschenaux@freesurf.ch>

## Licence
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.

## ONLINE DEMO

  You can check the latest online demo here: [https://alsenet-labs.github.io/merklizer](https://alsenet-labs.github.io/merklizer)

  Replace the release id in the url to access older versions.

# README

The actual demo is hashing files using SHA512-trunc, building a Merkle
tree from those hashes and anchoring the Merkle root on the Bitcoin and
Ethereum blockchains.

On the Ethereum blockchain (using the [MetaMask browser extension](https://metamask.io/))
or a local node if available. (We recommend to use the Kovan testing network for the demo (faster)).

On the Bitcoin blockchain using a public service (eg: https://blockexplorer.com).
(Anchoring on Bitcoin testnet is currently disabled for the online demo)

After the blockchain transaction appears on the blockchain(s), it allows
you to download a zip archive containing all the Merkle proofs and the
anchoring details, one json per file, and optionally one QRCode per json.

Files are NOT transmitted to the server, everything occurs client-side.

Provisions are made to allow anchoring data on other blockchains.

In the future you will be able to enter your public key and to obtain raw
transactions. Then you will be able to sign and send the transactions using
your preferred wallet(s), and to enter the resulting transaction id(s) in order
to complete the process and prepare the proofs.

## Optional features that can be enabled in webapp/config.json:

**config.generate_qrcode**:
Generate a QRCode for every proof json.

**config.include_associated_text_files_in_proof**:
When for each file there is a .txt file associated, the text file content is
added to the first file's json. Thus a description can be displayed when
validating the file with the json (or the QRCode alone), and its hash is part
of the proof. No separate json proof is generated for the text file.

**config.include_standalone_text_files_in_proof**:
When the file to be anchored is a text file, its content is added to the json.

## Quickstart
Before all you must have the latest Android SDK (ideally installed via
Android Studio) and a fairly recent LTS nodeJS release (ideally installed
in user space via nvm)

Download and build with:
```
git clone https://github.com/alsenet-labs/merlizer
cd merklizer
make
```
Rebuild with:
```
make # use "make ugly" instead to minimize javascript (slow)
```
Run in the browser without cordova:
```
make run-webapp
```
Run in the browser with cordova: [only for development, because camera is not doing well currently using WebRTC]
```
make run-cordova
```
Run on Android with cordova:
```
make run-cordova-android
```

Rebuild the gh-pages demo with:
```
git stash save # don't include anything not yet commited
export TAG=<tag>
gulp build
MERKLIZER_TAGNAME=$TAG gulp update-ghpages
git add html
git commit html -m "update gh-pages"
git push origin master
git tag $TAG
git push origin $TAG
git stash pop # restore un-commited changes

```

## Android Application Privacy Policy
* The Android application use your camera to scan QRCodes.

* Processing is done locally, data transmitted by our application to external
services is limited to the transaction and block hashes when retrieving
transactions details, and to the account numbers associated when the user
request accounts details interactively.

## Troubleshooting

### TypeError: Cannot read property 'apply' of undefined
Message:
```
(...)/lib/node_modules/gulp/bin/gulp.js:129
    gulpInst.start.apply(gulpInst,toRun); TypeError: Cannot read property 'apply' of undefined
```
Fix with:
```
node i -g gulp-cli
```
or remove gulp globally and re-install 4.0 globally

### EACCESS error when building project
Message:
```
(...)/platforms/android/cordova/node_modules/q/q.js:570:49 code: 'EACCES', errno: 'EACCES', syscall: 'spawn' }
```
Fix with:
```
sudo chmod 755 $(which gradle)
```

### INSTALL_FAILED_UPDATE_INCOMPATIBLE when running project
Uninstall the conflicting version - directly from the phone, or with adb:
```
adb uninstall com.alsenet.merklizer
```

When running gulp in the webapp folder and the maximum number of inotify
watchers is set too low, the error below may occurs during continuous
integration:
```
Error: watch (...)/merklizer/webapp/node_modules/assert-plus/assert.js ENOSPC
```
In which case the limit must be raised with something like:
```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
