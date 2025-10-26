import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.fine_records (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE NOT NULL,
        co2_fine DECIMAL(10, 2) NOT NULL DEFAULT 0,
        co_fine DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total_fine DECIMAL(10, 2) NOT NULL DEFAULT 0,
        co2_level DECIMAL(10, 2) NOT NULL,
        co_level DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        UNIQUE(date)
      );
    `;

    const { error: createError } = await supabaseClient.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('Error creating table:', createError);
      throw createError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Fine records table created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});