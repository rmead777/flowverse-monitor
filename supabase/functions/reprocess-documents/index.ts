
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
    // Get the request parameters
    const { documentId, knowledgeBaseId } = await req.json();
    
    // Find pending documents to process
    let pendingDocumentsQuery = supabase
      .from('documents')
      .select('*')
      .eq('status', 'pending');
    
    // Add filters if provided
    if (documentId) {
      pendingDocumentsQuery = pendingDocumentsQuery.eq('id', documentId);
    }
    
    if (knowledgeBaseId) {
      pendingDocumentsQuery = pendingDocumentsQuery.eq('knowledge_base_id', knowledgeBaseId);
    }
    
    const { data: pendingDocuments, error: queryError } = await pendingDocumentsQuery;
    
    if (queryError) throw queryError;
    
    if (!pendingDocuments || pendingDocuments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending documents found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process each pending document
    const results = [];
    
    for (const doc of pendingDocuments) {
      try {
        const { data, error } = await supabase.functions.invoke('process-document', {
          body: { documentId: doc.id }
        });
        
        results.push({
          id: doc.id,
          filename: doc.filename,
          success: !error,
          message: error ? error.message : 'Document processing started'
        });
      } catch (processError) {
        results.push({
          id: doc.id,
          filename: doc.filename,
          success: false,
          message: `Error: ${processError.message}`
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error reprocessing documents:', error);
    return new Response(
      JSON.stringify({ error: `Failed to reprocess documents: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
