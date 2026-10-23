@echo off
REM Scan to Screen: open the TV display in Chrome kiosk mode (Windows).
REM Double-click this file. To exit kiosk mode: Alt + F4.
REM To start automatically at login: press Win+R, type shell:startup, and put a
REM shortcut to this file in that folder.
REM A separate Chrome profile is used so kiosk mode works even when Chrome is already open.

set "URL=https://scan-to-screen.vercel.app/tv"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

start "" "%CHROME%" --kiosk "%URL%" --user-data-dir="%LOCALAPPDATA%\ScanToScreenKiosk" --no-first-run --no-default-browser-check --noerrdialogs --disable-session-crashed-bubble --disable-infobars --disable-translate --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required
