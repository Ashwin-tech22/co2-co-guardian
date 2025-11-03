# CO2 & CO Guardian - Permanent Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Find Your Computer's IP Address
1. Press `Win + R`, type `cmd`, press Enter
2. Type `ipconfig` and press Enter
3. Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)
4. Write this down - you'll need it for the Arduino code

### Step 2: Update Arduino Code
1. Open `final-arduino-code.ino` in Arduino IDE
2. Update these lines with your WiFi details:
   ```cpp
   const char* ssid     = "YourWiFiName";
   const char* password = "YourWiFiPassword";
   ```
3. Update this line with your computer's IP address:
   ```cpp
   const char* serverURL = "http://YOUR_IP_ADDRESS:3001/sensor-data";
   ```
   Example: `"http://192.168.1.100:3001/sensor-data"`

### Step 3: Install Arduino Libraries
In Arduino IDE, go to Tools > Manage Libraries and install:
- `ArduinoJson` by Benoit Blanchon
- `HTTPClient` (usually pre-installed with ESP32)

### Step 4: Start the Server
1. Double-click `start-server.bat`
2. You should see: "🚀 Sensor HTTP server running on all interfaces"
3. Keep this window open - this receives data from your Arduino

### Step 5: Start the Website
1. Open a new Command Prompt in the project folder
2. Run: `npm run dev`
3. Open your browser to the URL shown (usually http://localhost:5173)

### Step 6: Upload Arduino Code
1. Connect your ESP32 to your computer
2. Select the correct board and port in Arduino IDE
3. Upload `final-arduino-code.ino`
4. Open Serial Monitor to see the connection status

## 🔧 How It Works

```
Arduino ESP32 → WiFi → HTTP Server (port 3001) → Supabase → Website (real-time updates)
```

1. **Arduino** reads sensors every second, sends data every 5 seconds via HTTP
2. **HTTP Server** receives data and forwards to Supabase
3. **Supabase** stores data and triggers real-time updates
4. **Website** receives updates instantly and displays charts/metrics

## 🚨 Troubleshooting

### Arduino Not Connecting to WiFi
- Check WiFi name and password in the code
- Make sure your WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check Serial Monitor for error messages

### Website Not Updating
- Make sure `start-server.bat` is running
- Check if Arduino is sending data (Serial Monitor shows "✅ HTTP Response")
- Verify your computer's IP address hasn't changed

### Server Not Starting
- Make sure port 3001 is not in use by another program
- Check if Node.js is installed: `node --version`
- Install dependencies: `npm install`

## 📊 Expected Behavior

### Arduino Serial Monitor Should Show:
```
🚀 CO2 & CO Guardian Starting...
📊 Calibrating sensors... Keep in clean air.
✅ MQ135 R0: 10234.5 ohms
✅ MQ7   R0: 15678.9 ohms
🎯 Calibration complete!
✅ WiFi connected
📍 IP address: 192.168.1.105
🎯 System ready! Monitoring air quality...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌬️  MQ135 (CO2): 456.7 ppm (SAFE)
☠️  MQ7 (CO)   : 23.4 ppm (SAFE)
🚨 OVERALL: SAFE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Sending: {"co2_level":456.7,"co_level":23.4}
✅ HTTP Response (200): {"success":true,"message":"Data received and stored"}
```

### Website Should Show:
- Status: "Connected" (green)
- Real-time CO2 and CO levels
- Charts updating every 5 seconds
- Health impact and suggestions

## 🔄 Making It Permanent

### Auto-start Server on Windows Boot:
1. Press `Win + R`, type `shell:startup`, press Enter
2. Copy `start-server.bat` to this folder
3. Server will start automatically when Windows boots

### Keep Arduino Running:
- Use a USB power adapter instead of computer USB
- Arduino will automatically reconnect to WiFi if connection drops
- Data will resume sending once connection is restored

## 📱 Remote Access

To access your dashboard from other devices on the same network:
1. Find your computer's IP address (Step 1 above)
2. On any device connected to the same WiFi, go to: `http://YOUR_IP_ADDRESS:5173`

## 🛡️ Security Notes

- This setup works on your local network only
- For internet access, you'd need to configure port forwarding on your router
- The current setup is perfect for home/office monitoring

## 📞 Support

If you encounter issues:
1. Check the Serial Monitor for Arduino errors
2. Check the server console for HTTP errors
3. Check browser console (F12) for website errors
4. Ensure all devices are on the same WiFi network