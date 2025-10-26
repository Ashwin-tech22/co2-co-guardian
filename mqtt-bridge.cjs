const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const SUPABASE_URL = 'https://vynwpjxqvblzztydqnyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bndwanhxdmJsenp0eWRxbnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MzM2MzEsImV4cCI6MjA3NjQwOTYzMX0.43Pck3jit_g2tz-SoVbiWLB0pqOsN2D_m_hBoAcki8k';

const client = mqtt.connect('mqtts://37cbb6eafd9c4d98bc51cd9cd50b2d09.s1.eu.hivemq.cloud:8883', {
  username: 'Ashwin',
  password: 'asHwin#13',
  rejectUnauthorized: false
});

client.on('connect', () => {
  console.log('✅ MQTT Bridge connected to HiveMQ');
  client.subscribe('emissionchecker/airquality', (err) => {
    if (err) console.error('❌ Subscribe error:', err);
    else console.log('✅ Subscribed to emissionchecker/airquality');
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