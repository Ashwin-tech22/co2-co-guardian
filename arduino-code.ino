#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "https://vynwpjxqvblzztydqnyt.supabase.co/functions/v1/receive-sensor-data";
const char* authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bndwanhxdmJsenp0eWRxbnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MzM2MzEsImV4cCI6MjA3NjQwOTYzMX0.43Pck3jit_g2tz-SoVbiWLB0pqOsN2D_m_hBoAcki8k";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");
}

void loop() {
  // Replace with your actual sensor readings
  float co2_level = random(400, 1000);
  float co_level = random(10, 50);
  
  sendSensorData(co2_level, co_level);
  delay(10000); // Send every 10 seconds
}

void sendSensorData(float co2, float co) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + authToken);
    
    StaticJsonDocument<200> doc;
    doc["co2_level"] = co2;
    doc["co_level"] = co;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("Sending: " + jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("✅ HTTP Response: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("❌ HTTP Error: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}