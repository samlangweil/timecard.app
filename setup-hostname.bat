@echo off
echo Adding timecard.local to your hosts file...
echo. >> C:\Windows\System32\drivers\etc\hosts
echo # Weekly Timecard App >> C:\Windows\System32\drivers\etc\hosts
echo 127.0.0.1    timecard.local >> C:\Windows\System32\drivers\etc\hosts
echo.
echo Done! You can now access your app at http://timecard.local:3000
pause
