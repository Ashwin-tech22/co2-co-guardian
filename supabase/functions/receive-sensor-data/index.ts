import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { co2_level, co_level } = await req.json();
    
    console.log('Received sensor data:', { co2_level, co_level });

    // Validate data
    if (typeof co2_level !== 'number' || typeof co_level !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid data format. Expected numbers for co2_level and co_level' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert data into database
    const { data, error } = await supabaseClient
      .from('air_quality_readings')
      .insert([
        {
          co2_level,
          co_level,
          timestamp: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Data inserted successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data received and stored successfully',
        data: data[0]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in receive-sensor-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
