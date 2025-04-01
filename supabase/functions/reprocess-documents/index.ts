
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Serve the HTTP request
Deno.serve(async (req) => {
  console.log("Reprocess-documents function invoked");
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get env variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Validate env variables
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { knowledgeBaseId } = await req.json();
    console.log(`Looking for pending documents${knowledgeBaseId ? ` in knowledge base: ${knowledgeBaseId}` : ''}`);

    // Find documents with 'pending' or 'failed' status
    let query = supabase
      .from('documents')
      .select('id, filename, status')
      .in('status', ['pending', 'failed']);
    
    // Filter by knowledge base ID if provided
    if (knowledgeBaseId) {
      query = query.eq('knowledge_base_id', knowledgeBaseId);
    }

    const { data: pendingDocuments, error: pendingError } = await query;

    if (pendingError) {
      console.error('Error finding pending documents:', pendingError);
      throw pendingError;
    }

    console.log(`Found ${pendingDocuments ? pendingDocuments.length : 0} pending documents`);

    // No pending documents, return early
    if (!pendingDocuments || pendingDocuments.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending documents found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each document in sequence
    const processedDocIds = [];
    const failedDocIds = [];

    for (const doc of pendingDocuments) {
      try {
        console.log(`Processing document ${doc.id} (${doc.filename})`);
        
        // Call the process-document function with the document ID
        const { error: processError } = await supabase.functions
          .invoke('process-document', {
            body: { documentId: doc.id }
          });
        
        if (processError) {
          console.error(`Error processing document ${doc.id}:`, processError);
          failedDocIds.push(doc.id);
        } else {
          processedDocIds.push(doc.id);
        }
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        failedDocIds.push(doc.id);
      }
    }

    return new Response(
      JSON.stringify({
        processed: processedDocIds.length,
        failed: failedDocIds.length,
        message: `Processed ${processedDocIds.length} documents, failed ${failedDocIds.length} documents`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('General error in reprocess-documents function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        processed: 0,
        failed: 0 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
