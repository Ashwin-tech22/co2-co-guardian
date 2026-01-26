import { supabase } from '@/integrations/supabase/client';

export const insertSensorData = async (co2_level: number, co_level: number) => {
  try {
    const { data, error } = await supabase
      .from('air_quality_readings')
      .insert({
        co2_level,
        co_level,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return { success: false, error };
    }

    console.log('Data inserted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Insert operation failed:', error);
    return { success: false, error };
  }
};

export const getLatestReadings = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('air_quality_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database fetch error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Fetch operation failed:', error);
    return { success: false, error };
  }
};