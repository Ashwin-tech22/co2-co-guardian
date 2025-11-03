#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define MQ135_PIN   34  
#define MQ7_PIN     35  
#define GREEN_LED   27  
#define YELLOW_LED  26  
#define RED_LED     25  
#define BUZZER_PIN  14  

#define RL_VALUE    10000  
#define VREF        3.3

float R0_MQ135 = 10000;
float R0_MQ7   = 10000; 

// Thresholds in ppm
const int MQ135_SAFE      = 800;
const int MQ135_MODERATE  = 1200;
const int MQ135_DANGER    = 2100;
const int MQ7_SAFE        = 35;
const int MQ7_MODERATE    = 150;
const int MQ7_DANGER      = 400;

// WiFi credentials
const char* ssid     = "OnePlus";
const char* password = "hiashwin";

// HTTP endpoint - replace with your computer's IP address
const char* serverURL = "http://192.168.1.100:3001/sensor-data";

float mq135_ppm = 0;
float mq7_ppm = 0;
unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void sendToHTTP() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["co2_level"] = mq135_ppm;
    doc["co_level"] = mq7_ppm;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.print("📡 Sending HTTP data: ");
    Serial.println(jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("✅ HTTP Response: ");
      Serial.println(response);
    } else {
      Serial.print("❌ HTTP Error: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("❌ WiFi not connected");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  delay(4000); 
  Serial.println("Calibrating sensors... Keep in clean air.");
  calibrateSensors();

  setup_wifi();
}

void loop() {
  int mq135_adc = analogRead(MQ135_PIN);
  mq135_ppm = mq135_getPPM(mq135_adc);

  int mq7_adc = analogRead(MQ7_PIN);
  mq7_ppm = mq7_getPPM(mq7_adc);

  String mq135_status = "SAFE";
  if (mq135_ppm > MQ135_DANGER)
    mq135_status = "DANGEROUS";
  else if (mq135_ppm > MQ135_MODERATE)
    mq135_status = "MODERATE";

  String mq7_status = "SAFE";
  if (mq7_ppm > MQ7_DANGER)
    mq7_status = "DANGEROUS";
  else if (mq7_ppm > MQ7_MODERATE)
    mq7_status = "MODERATE";

  String overall_status = "SAFE";
  if (mq135_status == "DANGEROUS" || mq7_status == "DANGEROUS")
    overall_status = "DANGEROUS";
  else if (mq135_status == "MODERATE" || mq7_status == "MODERATE")
    overall_status = "MODERATE";

  Serial.println("------ Air Quality Monitor ------");
  Serial.print("MQ135 (CO2): ");
  Serial.print(mq135_ppm, 1); Serial.print(" ppm \t(Status: ");
  Serial.print(mq135_status); Serial.println(")");

  Serial.print("MQ7 (CO)  : ");
  Serial.print(mq7_ppm, 1); Serial.print(" ppm \t(Status: ");
  Serial.print(mq7_status); Serial.println(")");

  Serial.print("OVERALL STATUS: "); Serial.println(overall_status);
  Serial.println("---------------------------------");

  if (overall_status == "SAFE") {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(YELLOW_LED, LOW);
    digitalWrite(RED_LED, LOW);
    digitalWrite(BUZZER_PIN, LOW);
  } else if (overall_status == "MODERATE") {
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(YELLOW_LED, HIGH);
    digitalWrite(RED_LED, LOW);
    pinMode(BUZZER_PIN, OUTPUT);
    tone(BUZZER_PIN, 2000, 80); 
    delay(200);
    noTone(BUZZER_PIN);
  } else { 
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(YELLOW_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    pinMode(BUZZER_PIN, OUTPUT);
    tone(BUZZER_PIN, 2000);
  }

  // HTTP update every 5 seconds
  unsigned long now = millis();
  if (now - lastMsg > 5000) { 
    lastMsg = now;
    sendToHTTP();
  }

  delay(1000);
}

void calibrateSensors() {
  R0_MQ135 = mq135_getR0();
  R0_MQ7   = mq7_getR0();
  Serial.print("MQ135 R0: "); Serial.print(R0_MQ135, 1); Serial.println(" ohms");
  Serial.print("MQ7   R0: "); Serial.print(R0_MQ7, 1); Serial.println(" ohms");
  Serial.println("Calibration done.");
}

float getSensorResistance(int adcValue) {
  float vrl = ((float)adcValue / 4095.0) * VREF;
  return ((VREF - vrl) / vrl) * RL_VALUE;
}

float mq135_getR0() {
  long sum = 0;
  const int samples = 50;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(MQ135_PIN);
    delay(20);
  }
  float avg_adc = (float)sum / samples;
  float Rs = getSensorResistance((int)avg_adc);
  return Rs / 3.6;
}

float mq7_getR0() {
  long sum = 0;
  const int samples = 50;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(MQ7_PIN);
    delay(20);
  }
  float avg_adc = (float)sum / samples;
  float Rs = getSensorResistance((int)avg_adc);
  return Rs / 27.0;
}

float mq135_getPPM(int adcValue) {
  float Rs = getSensorResistance(adcValue);
  float ratio = Rs / R0_MQ135;
  const float a = -2.769, b = 2.602;
  return pow(10, (a * log10(ratio) + b));
}

float mq7_getPPM(int adcValue) {
  float Rs = getSensorResistance(adcValue);
  float ratio = Rs / R0_MQ7;
  const float a = -1.497, b = 1.698;
  return pow(10, (a * log10(ratio) + b));
}