import mqtt from 'mqtt';
import { insertSensorData } from './dataService';

interface SensorData {
  co2_level: number;
  co_level: number;
}

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  private isConnecting = false;

  connect() {
    if (this.client?.connected) {
      console.log('MQTT already connected');
      return;
    }
    
    if (this.isConnecting) {
      console.log('MQTT connection already in progress');
      return;
    }
    
    this.isConnecting = true;

    const brokerUrl = 'wss://37cbb6eafd9c4d98bc51cd9cd50b2d09.s1.eu.hivemq.cloud:8884/mqtt';
    
    const options = {
      username: 'Ashwin',
      password: 'asHwin#13',
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      clientId: 'web_client_' + Math.random().toString(16).substr(2, 8)
    };

    console.log('🔌 Connecting to MQTT broker:', brokerUrl);
    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      console.log('✅ MQTT connected successfully');
      this.isConnecting = false;
      this.client?.subscribe('emissionchecker/airquality', (err) => {
        if (err) console.error('❌ Subscribe error:', err);
        else console.log('✅ Subscribed to emissionchecker/airquality topic');
      });
    });

    this.client.on('message', (topic, message) => {
      console.log('📨 Received MQTT message:', { topic, message: message.toString() });
      try {
        const rawData = JSON.parse(message.toString());
        const data: SensorData = {
          co2_level: rawData.CO2,
          co_level: rawData.CO
        };
        console.log('📊 Parsed sensor data:', data);
        this.sendToSupabase(data);
      } catch (error) {
        console.error('❌ Error parsing message:', error, 'Raw message:', message.toString());
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
      this.isConnecting = false;
    });

    this.client.on('disconnect', () => {
      console.log('🔌 MQTT disconnected');
      this.isConnecting = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });
  }

  private async sendToSupabase(data: SensorData) {
    console.log('🚀 Sending to database:', data);
    const result = await insertSensorData(data.co2_level, data.co_level);
    
    if (result.success) {
      console.log('✅ Data saved successfully');
    } else {
      console.error('❌ Failed to save data:', result.error);
    }
  }

  disconnect() {
    if (this.client) {
      console.log('🔌 Disconnecting MQTT client');
      this.client.end();
      this.client = null;
      this.isConnecting = false;
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const mqttClient = new MQTTClient();