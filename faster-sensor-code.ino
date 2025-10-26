#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// Sensor & GPIO definitions
#define MQ135_PIN    34   // MQ-135 (CO2) analog pin
#define MQ7_PIN      35   // MQ-7 (CO)  analog pin
#define GREEN_LED    27   // Green LED (safe)
#define YELLOW_LED   26   // Yellow/Blue LED (moderate)
#define RED_LED      25   // Red LED (high)
#define BUZZER_PIN   14   // Buzzer pin

#define RL_VALUE     10000      // 10k Ohm load resistor
#define VREF         3.3        // ESP32 supply/reference voltage

float R0_MQ135 = 10000; // Will be set at startup (typical ~10K)
float R0_MQ7   = 10000; // Will be set at startup (typical ~10K)

// Thresholds in ppm
const int MQ135_SAFE      = 800;
const int MQ135_MODERATE  = 1200;
const int MQ135_DANGER    = 2100;
const int MQ7_SAFE        = 35;
const int MQ7_MODERATE    = 150;
const int MQ7_DANGER      = 400;

// WiFi credentials
const char* ssid     = "POCO X6 5G";
const char* password = "";

// HiveMQ Cloud credentials and host
const char* mqtt_server = "37cbb6eafd9c4d98bc51cd9cd50b2d09.s1.eu.hivemq.cloud";
const int mqtt_port     = 8883; // Secure port
const char* mqtt_user   = "Ashwin";
const char* mqtt_pass   = "asHwin#13";

WiFiClientSecure net;
PubSubClient client(net);

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
}

void configTLS() {
  net.setInsecure(); // For demo only!
  // For production, set proper CA root cert: net.setCACert(hivemq_root_ca);
}

void reconnect() {
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

void sendToMQTT() {
  char payload[128];
  snprintf(payload, sizeof(payload),
           "{\"CO2\":%.2f,\"CO\":%.2f}", mq135_ppm, mq7_ppm);
  client.publish("emissionchecker/airquality", payload);
}

void setup() {
  Serial.begin(115200);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  delay(4000); // Sensor preheat
  Serial.println("Calibrating sensors... Keep in clean air.");
  calibrateSensors();

  configTLS();
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  int mq135_adc = analogRead(MQ135_PIN);
  mq135_ppm = mq135_getPPM(mq135_adc);

  int mq7_adc = analogRead(MQ7_PIN);
  mq7_ppm = mq7_getPPM(mq7_adc);

  // MQ135 status
  String mq135_status = "SAFE";
  if (mq135_ppm > MQ135_DANGER)
    mq135_status = "DANGEROUS";
  else if (mq135_ppm > MQ135_MODERATE)
    mq135_status = "MODERATE";

  // MQ7 status
  String mq7_status = "SAFE";
  if (mq7_ppm > MQ7_DANGER)
    mq7_status = "DANGEROUS";
  else if (mq7_ppm > MQ7_MODERATE)
    mq7_status = "MODERATE";

  // Overall status logic
  String overall_status = "SAFE";
  if (mq135_status == "DANGEROUS" || mq7_status == "DANGEROUS")
    overall_status = "DANGEROUS";
  else if (mq135_status == "MODERATE" || mq7_status == "MODERATE")
    overall_status = "MODERATE";

  // Serial output
  Serial.println("------ Air Quality Monitor ------");
  Serial.print("MQ135 (CO2): ");
  Serial.print(mq135_ppm, 1); Serial.print(" ppm \t(Status: ");
  Serial.print(mq135_status); Serial.println(")");

  Serial.print("MQ7 (CO)  : ");
  Serial.print(mq7_ppm, 1); Serial.print(" ppm \t(Status: ");
  Serial.print(mq7_status); Serial.println(")");

  Serial.print("OVERALL STATUS: "); Serial.println(overall_status);
  Serial.println("---------------------------------");

  // LED & buzzer logic
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
    tone(BUZZER_PIN, 2000, 80); // Soft beep
    delay(200);
    noTone(BUZZER_PIN);
  } else { // Dangerous
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(YELLOW_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    pinMode(BUZZER_PIN, OUTPUT);
    tone(BUZZER_PIN, 2000);
  }

  // MQTT update every 1 second
  unsigned long now = millis();
  if (now - lastMsg > 1000) { // every 1 second
    lastMsg = now;
    sendToMQTT();
  }

  delay(500); // Reduced from 1000ms
}

// --- Sensor Calibration & Conversion Functions ---

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