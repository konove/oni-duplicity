#!/bin/sh
# Entry point for the `e2e` service in docker-compose.yml.
#
# node_modules is a named volume, not the host's - the host tree carries win32
# native binaries Linux cannot load. That volume survives between runs, so a
# full `npm ci` every time would be pure waste; it is reinstalled only when
# package-lock.json has actually moved.
#
# Invoked as `sh docker/e2e-entrypoint.sh`, so it needs no executable bit -
# which git on Windows would not preserve anyway. .gitattributes keeps it LF;
# with CRLF the shebang line ends in \r and Linux reports "not found".
set -e

STAMP=node_modules/.package-lock-stamp
WANTED=$(md5sum package-lock.json | cut -d ' ' -f 1)

if [ "$(cat "$STAMP" 2>/dev/null)" != "$WANTED" ]; then
  echo "> installing dependencies in the container (package-lock.json changed)"
  npm ci --no-audit --fund=false
  echo "$WANTED" >"$STAMP"
fi

exec npx playwright test "$@"
