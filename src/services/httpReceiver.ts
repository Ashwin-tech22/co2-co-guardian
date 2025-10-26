import { supabase } from '@/integrations/supabase/client';

export const startHttpReceiver = () => {
  // Poll for new data every 5 seconds
  setInterval(async () => {
    try {
      // This will be replaced with actual HTTP endpoint
      console.log('Checking for sensor data...');
    } catch (error) {
      console.error('Error checking sensor data:', error);
    }
  }, 5000);
};

export const receiveSensorData = async (co2_level: number, co_level: number) => {
  try {
    const { data, error } = await supabase.functions.invoke('receive-sensor-data', {
      body: { co2_level, co_level }
    });
    
    if (error) {
      console.error('Error sending to Supabase:', error);
      return false;
    } else {
      console.log('✅ Data sent to Supabase successfully:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to send data to Supabase:', error);
    return false;
  }
};