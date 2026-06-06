#!/usr/bin/env bash
# Local preview server for pointcalc.in.
# Usage: ./serve.sh  (defaults to port 4173)
#        ./serve.sh 8080

set -e

PORT="${1:-4173}"
cd "$(dirname "$0")"

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Try: ./serve.sh 8080"
  exit 1
fi

echo "Serving $(pwd)"
echo "Open: http://localhost:$PORT/"
echo "Press Ctrl+C to stop."
echo

exec python3 -m http.server "$PORT"
