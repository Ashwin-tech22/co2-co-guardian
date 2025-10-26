require('dotenv').config();
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vynwpjxqvblzztydqnyt.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_TOPIC = process.env.MQTT_TOPIC;

const client = mqtt.connect(MQTT_BROKER_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  rejectUnauthorized: false
});

client.on('connect', () => {
  console.log('✅ MQTT Bridge connected to HiveMQ');
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) console.error('❌ Subscribe error:', err);
    else console.log(`✅ Subscribed to ${MQTT_TOPIC}`);
  });
});

client.on('message', async (topic, message) => {
  try {
    const rawData = JSON.parse(message.toString());
    const data = {
      co2_level: rawData.CO2,
      co_level: rawData.CO
    };
    
    console.log('📡 Received sensor data:', data);
    
    const response = await axios.post(
      `${SUPABASE_URL}/functions/v1/receive-sensor-data`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Data sent to Supabase successfully');
  } catch (error) {
    console.error('❌ Error processing message:', error.message);
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT error:', error);
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🌉 MQTT Bridge running on port ${PORT}`);
});