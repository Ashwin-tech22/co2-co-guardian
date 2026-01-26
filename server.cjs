const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = 'https://vynwpjxqvblzztydqnyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bndwanhxdmJsenp0eWRxbnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MzM2MzEsImV4cCI6MjA3NjQwOTYzMX0.43Pck3jit_g2tz-SoVbiWLB0pqOsN2D_m_hBoAcki8k';

app.post('/sensor-data', async (req, res) => {
  try {
    const { co2_level, co_level } = req.body;
    
    console.log('📡 Received sensor data:', { co2_level, co_level, timestamp: new Date().toISOString() });
    
    const response = await axios.post(
      `${SUPABASE_URL}/functions/v1/receive-sensor-data`,
      { co2_level, co_level },
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Data sent to Supabase successfully');
    res.json({ success: true, message: 'Data received and stored' });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/status', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Sensor HTTP server running on all interfaces');
  console.log(`📡 Local: http://localhost:${PORT}`);
  console.log(`📡 Network: http://0.0.0.0:${PORT}`);
  console.log(`📋 Send POST to: /sensor-data with {"co2_level": 400, "co_level": 10}`);
});