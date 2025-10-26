import mqtt from 'mqtt';
import { supabase } from '@/integrations/supabase/client';

interface SensorData {
  co2_level: number;
  co_level: number;
}

class MQTTClient {
  private client: mqtt.MqttClient | null = null;

  connect() {
    const options = {
      host: '37cbb6eafd9c4d98bc51cd9cd50b2d09.s1.eu.hivemq.cloud',
      port: 8884,
      protocol: 'wss' as const,
      username: 'Ashwin',
      password: 'asHwin#13',
      clean: true,
      reconnectPeriod: 5000,
    };

    this.client = mqtt.connect(options);

    this.client.on('connect', () => {
      console.log('✅ MQTT connected successfully');
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
      console.error('MQTT error:', error);
    });
  }

  private async sendToSupabase(data: SensorData) {
    console.log('🚀 Sending to Supabase:', data);
    try {
      const { data: result, error } = await supabase.functions.invoke('receive-sensor-data', {
        body: data
      });
      
      if (error) {
        console.error('❌ Supabase function error:', error);
      } else {
        console.log('✅ Data sent to Supabase successfully:', result);
      }
    } catch (error) {
      console.error('❌ Failed to send data to Supabase:', error);
    }
  }

  disconnect() {
    this.client?.end();
  }
}

export const mqttClient = new MQTTClient();