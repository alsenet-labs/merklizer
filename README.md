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

```
 git clone https://github.com/alsenet-labs/merlizer
 cd merklizer
 make
 make run-cordova
```

## Troubleshooting

When running gulp and the maximum number of inotify watchers is set too low,
the error below occurs during continuous integration initialization:
```
Error: watch /src/merklizer/node_modules/assert-plus/assert.js ENOSPC
```
In which case the limit must be raised with something like:
```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
