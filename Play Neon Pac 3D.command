#!/bin/zsh

cd "${0:A:h}" || exit 1

export PATH="/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
NPM_BIN="$(command -v npm)"

if [[ -z "$NPM_BIN" ]]; then
  osascript -e 'display dialog "Neon Pac 3D could not find Node.js. Please open Terminal and run: brew install node" buttons {"OK"} default button "OK" with icon stop'
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Preparing Neon Pac 3D for the first launch..."
  "$NPM_BIN" install || {
    osascript -e 'display dialog "Neon Pac 3D could not install its game files. Please check your internet connection and try again." buttons {"OK"} default button "OK" with icon stop'
    exit 1
  }
fi

echo "Starting Neon Pac 3D..."
echo "Keep this window open while playing. Press Control-C to stop."
"$NPM_BIN" run dev -- --host 127.0.0.1 &
SERVER_PID=$!

for attempt in {1..50}; do
  if curl --silent --fail "http://127.0.0.1:5173" >/dev/null 2>&1; then
    open "http://127.0.0.1:5173"
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 0.1
done

kill "$SERVER_PID" >/dev/null 2>&1
osascript -e 'display dialog "Neon Pac 3D did not start. Please try again or open README.md for manual instructions." buttons {"OK"} default button "OK" with icon stop'
exit 1
