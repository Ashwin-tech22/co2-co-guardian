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
    
    console.log('📡 Received sensor data:', { co2_level, co_level });
    
    // Send to Supabase function
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
    res.json({ success: true, message: 'Data received' });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Sensor HTTP endpoint running on http://localhost:${PORT}`);
  console.log(`📡 Send POST requests to: http://localhost:${PORT}/sensor-data`);
  console.log(`📋 Format: {"co2_level": 400, "co_level": 10}`);
});