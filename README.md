# merklizer
Web app for computing Merkle trees and anchoring hashes to the open public blockchains

__Under active development, don't use it for production yet.__

## Copyright
 Copyright (c) 2018 ALSENET SA

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

  You can check the online demo here: [https://alsenet-labs.github.io/merklizer](https://alsenet-labs.github.io/merklizer)

# README

The actual demo is hashing files using SHA512-256, building a Merkle
tree from those hashes and anchoring the Merkle root on the Bitcoin and
Ethereum blockchains.

On the Ethereum blockchain (using the [MetaMask browser extension](https://metamask.io/))
or a local node.

On the Bitcoin blockchain using a public service (eg: https://blockexplorer.com).

After the blockchain transaction appears on the blockchain(s), it allows
you to download a zip archive containing all the Merkle proofs and the
anchoring details, one json per input file.

Files are NOT transmitted to the server, everything occurs client-side.

Provisions are made to allow anchoring data on other blockchains.

In the future you will be able to enter your public key and to obtain raw
transactions. Then you will be able to sign and send the transactions using
your preferred wallet(s), and to enter the resulting transaction id(s) in order
to complete the process and prepare the proofs.

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
make # use "build ugly" instead to minimize javascript (slow)
```
Run in the browser without cordova:
```
make run-webapp
```
Run in the browser with cordova:
```
make run-cordova
```
Run on Android with cordova:
```
make run-cordova-android
```

Note: gh-pages branch is made of content of cordova/platforms/browser/www


## Troubleshooting

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
