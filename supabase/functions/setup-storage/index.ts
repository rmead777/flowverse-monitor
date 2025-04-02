
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    // Check if the documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    let documentsExists = buckets.some(bucket => bucket.name === 'documents');
    
    // Create the documents bucket if it doesn't exist
    if (!documentsExists) {
      const { error: createError } = await supabase
        .storage
        .createBucket('documents', {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        });
      
      if (createError) {
        throw createError;
      }
      
      // Set up a policy to allow authenticated users to upload files
      const { error: policyError } = await supabase.query(`
        CREATE POLICY "Allow authenticated users to upload" 
        ON storage.objects 
        FOR INSERT 
        TO authenticated 
        USING (bucket_id = 'documents' AND auth.uid() = owner);
        
        CREATE POLICY "Allow authenticated users to select their files" 
        ON storage.objects 
        FOR SELECT 
        TO authenticated 
        USING (bucket_id = 'documents' AND auth.uid() = owner);
        
        CREATE POLICY "Allow authenticated users to update their files" 
        ON storage.objects 
        FOR UPDATE 
        TO authenticated 
        USING (bucket_id = 'documents' AND auth.uid() = owner);
        
        CREATE POLICY "Allow authenticated users to delete their files" 
        ON storage.objects 
        FOR DELETE 
        TO authenticated 
        USING (bucket_id = 'documents' AND auth.uid() = owner);
      `);
      
      if (policyError && !policyError.message.includes('already exists')) {
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
  } catch (error) {
    console.error('Error setting up storage:', error);
    return new Response(
      JSON.stringify({ error: `Failed to set up storage: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
