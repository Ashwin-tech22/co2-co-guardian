@echo off
echo ========================================
echo    CO2 Guardian - IP Address Finder
echo ========================================
echo.
echo Your computer's IP addresses:
echo.
ipconfig | findstr /i "IPv4"
echo.
echo ========================================
echo Copy one of the IP addresses above
echo Example: 192.168.1.100
echo.
echo Update your Arduino code with:
echo const char* serverURL = "http://YOUR_IP:3001/sensor-data";
echo ========================================
pause