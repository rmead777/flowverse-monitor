
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

  // Get the request body
  let reqBody;
  try {
    reqBody = await req.json();
  } catch (error) {
    reqBody = {};
  }

  const { knowledgeBaseId } = reqBody;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing server environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Supabase client with service role for admin privileges
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log("Finding pending documents...");
    let query = supabase
      .from('documents')
      .select('id, filename')
      .eq('status', 'pending');

    // If knowledge base ID is provided, filter by it
    if (knowledgeBaseId) {
      query = query.eq('knowledge_base_id', knowledgeBaseId);
    }

    const { data: documents, error } = await query;

    if (error) {
      throw error;
    }

    // Only process if we find pending documents
    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0, 
          message: 'No pending documents found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${documents.length} pending documents to process`);

    for (const doc of documents) {
      console.log(`Triggering processing for document: ${doc.id} (${doc.filename})`);
      // Call the process-document function for each pending document
      const { data, error: processError } = await supabase.functions.invoke('process-document', {
        body: { documentId: doc.id }
      });

      if (processError) {
        console.error(`Error processing document ${doc.id}:`, processError);
      } else {
        console.log(`Started processing for document ${doc.id}:`, data);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: documents.length,
        message: `Processing started for ${documents.length} document(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error reprocessing documents:', error);
    return new Response(
      JSON.stringify({ error: `Failed to reprocess documents: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
