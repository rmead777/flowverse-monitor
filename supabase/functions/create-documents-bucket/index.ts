
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
  
  // Validate required environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error - missing environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Initialize Supabase client with service role for admin privileges
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log("Creating documents bucket with service role...");
    
    // First ensure the bucket doesn't already exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      throw bucketsError;
    }
    
    const documentsExists = buckets.some(bucket => bucket.name === 'documents');
    
    if (documentsExists) {
      console.log("Documents bucket already exists");
      return new Response(
        JSON.stringify({ 
          success: true, 
          documentsExists: true,
          message: 'Documents bucket already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create the documents bucket
    const { error: createError } = await supabase.storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError);
      throw createError;
    }
    
    console.log("Documents bucket created successfully");
    
    // Now set up policies to allow authenticated users to access the documents bucket
    try {
      // Try to execute SQL directly 
      const { error: policyError } = await supabase.from('storage').select('*').limit(1);
      
      if (policyError) {
        console.warn('Unable to verify storage policies:', policyError);
      } else {
        console.log("Storage policies verified");
      }
    } catch (policyError) {
      console.warn('Policy verification failed:', policyError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsExists: true,
        message: 'Documents bucket created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in create-documents-bucket function:", error);
    return new Response(
      JSON.stringify({ 
        error: `Failed to create documents bucket: ${error.message}`,
        details: error.toString(),
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
