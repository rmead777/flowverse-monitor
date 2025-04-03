
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing server environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Enable REPLICA IDENTITY FULL on agent_logs table for full row data in change events
    const { error: identityError } = await supabase.rpc('set_replica_identity_full', {
      table_name: 'agent_logs'
    });

    if (identityError) {
      throw identityError;
    }

    // Add the agent_logs table to the supabase_realtime publication
    const { error: publicationError } = await supabase.rpc('add_table_to_publication', {
      table_name: 'agent_logs'
    });

    if (publicationError) {
      throw publicationError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Realtime functionality enabled for agent_logs table'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error enabling realtime functionality:', error);
    return new Response(
      JSON.stringify({ error: `Failed to enable realtime: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
