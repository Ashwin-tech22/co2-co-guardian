#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "37cbb6eafd9c4d98bc51cd9cd50b2d09.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "Ashwin";
const char* mqtt_pass = "asHwin#13";

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");
  
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  
  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  
  // Replace with your actual sensor readings
  float co2_level = readCO2Sensor();
  float co_level = readCOSensor();
  
  publishSensorData(co2_level, co_level);
  delay(10000);
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" trying again in 5s");
      delay(5000);
    }
  }
}

void publishSensorData(float co2, float co) {
  StaticJsonDocument<200> doc;
  doc["co2_level"] = co2;
  doc["co_level"] = co;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Publishing: " + jsonString);
  
  if (client.publish("sensor/data", jsonString.c_str())) {
    Serial.println("✅ Data published successfully!");
  } else {
    Serial.println("❌ Failed to publish data");
  }
}

float readCO2Sensor() {
  // Your CO2 sensor code here
  return random(400, 1000);
}

float readCOSensor() {
  // Your CO sensor code here
  return random(10, 50);
}