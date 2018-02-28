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

  You can check the online demo here: [https://alsenet-labs.github.io/merklizer/dist/index.html](https://alsenet-labs.github.io/merklizer/dist/index.html)

  Please note that the QRCode part is not yet functional.

# README

The actual demo is hashing files using SHA512-256, building a Merkle
tree from those hashes and anchoring the Merkle root directly to
the Ethereum blockchain (using the [MetaMask browser extension](https://metamask.io/))
or a local node.

After the blockchain transaction appears on the blockchain, it allows
you to download a zip archive containing all the Merkle proofs and the
anchoring details, one json per input file.

Files are NOT transmitted to the server, everything occurs client-side.

Provisions are made to allow anchoring data on other blockchains.

## Quickstart

```
 git clone https://github.com/alsenet-labs/merlizer
 cd merklizer
 yarn
 gulp
```

## Troubleshooting

When running gulp and the maximum number of inotify watchers is set too low, the error below occurs during continuous integration initialization:
```
Error: watch /src/merklizer/node_modules/assert-plus/assert.js ENOSPC
```
In which case the limit must be raised with something like:
```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
