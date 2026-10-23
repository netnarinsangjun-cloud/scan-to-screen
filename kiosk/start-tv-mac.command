#!/bin/bash
# Scan to Screen: open the TV display in Chrome kiosk mode (macOS).
# Double-click this file. To exit kiosk mode: Cmd + Q.
#
# A separate Chrome profile is used so kiosk mode works even when your normal
# Chrome is already open, and so no personal tabs or sign-ins appear on the TV.

URL="https://scan-to-screen.vercel.app/tv"
PROFILE="$HOME/Library/Application Support/ScanToScreenKiosk"

open -na "Google Chrome" --args \
  --kiosk "$URL" \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --disable-translate \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --autoplay-policy=no-user-gesture-required

# Keep the Mac awake while the TV is running (stops by itself when Chrome quits).
sleep 3
PID="$(pgrep -o -f "user-data-dir=.*ScanToScreenKiosk")"
if [ -n "$PID" ]; then
  nohup caffeinate -dimsu -w "$PID" >/dev/null 2>&1 &
fi
