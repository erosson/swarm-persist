#!/bin/sh -eux
cd "`dirname "$0"`"
#cd .. && npm run build && cd -
python -m SimpleHTTPServer
