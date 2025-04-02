
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
    console.log("Checking if documents bucket exists...");
    // Check if the documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      
      // More detailed error logging
      if (bucketsError.message.includes('Policy')) {
        console.log("This appears to be a Row Level Security (RLS) policy error.");
        console.log("Attempting to create bucket with admin privileges...");
        
        // Try direct SQL approach with service role to bypass RLS
        const { error: sqlError } = await supabase.rpc('create_documents_bucket');
        
        if (sqlError) {
          console.error("Error calling create_documents_bucket RPC:", sqlError);
          throw sqlError;
        } else {
          console.log("Successfully created documents bucket via RPC function");
          
          // Check if the bucket was created successfully
          const { data: checkBuckets, error: checkError } = await supabase.storage.listBuckets();
          
          if (checkError) {
            console.error("Error verifying bucket creation:", checkError);
            throw checkError;
          }
          
          const documentsExists = checkBuckets.some(bucket => bucket.name === 'documents');
          console.log("Documents bucket exists after RPC call:", documentsExists);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              documentsExists,
              message: 'Documents bucket created via RPC function',
              method: 'rpc'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        throw bucketsError;
      }
    }
    
    let documentsExists = buckets.some(bucket => bucket.name === 'documents');
    console.log("Documents bucket exists:", documentsExists);
    
    // Create the documents bucket if it doesn't exist
    if (!documentsExists) {
      console.log("Creating documents bucket...");
      const { error: createError } = await supabase
        .storage
        .createBucket('documents', {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
        
        // If we get a policy-related error, try the RPC approach
        if (createError.message.includes('Policy')) {
          console.log("This appears to be a Row Level Security (RLS) policy error.");
          console.log("Attempting to create bucket with admin privileges...");
          
          // Try direct SQL approach with service role to bypass RLS
          const { error: sqlError } = await supabase.rpc('create_documents_bucket');
          
          if (sqlError) {
            console.error("Error calling create_documents_bucket RPC:", sqlError);
            throw sqlError;
          } else {
            console.log("Successfully created documents bucket via RPC function");
            documentsExists = true;
          }
        } else {
          throw createError;
        }
      }
      
      console.log("Setting up storage policies...");
      // Set up policies to allow authenticated users to access the documents bucket
      try {
        // Create policies for authenticated users
        await supabase.rpc('create_document_storage_policies');
        console.log("Policies created successfully via RPC");
      } catch (policyError: any) {
        console.warn('Policy creation failed:', policyError);
      }
      
      documentsExists = true;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsExists,
        message: documentsExists ? 'Documents bucket exists' : 'Documents bucket created'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error setting up storage:', error);
    return new Response(
      JSON.stringify({ 
        error: `Failed to set up storage: ${error.message}`,
        details: error.toString(),
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
