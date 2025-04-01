
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

// Define the function handler
Deno.serve(async (req: Request) => {
  // Set up CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse the request body
    const { query, knowledge_base_id, limit = 10, similarity_threshold = 0.8, filters = {} } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ 
          error: "Missing query in request body" 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    if (!knowledge_base_id) {
      return new Response(
        JSON.stringify({ 
          error: "Missing knowledge_base_id in request body" 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    console.log(`Vector search for "${query}" in knowledge base: ${knowledge_base_id}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get knowledge base details to determine embedding model
    const { data: knowledgeBase, error: kbError } = await supabase
      .from("knowledge_bases")
      .select("*")
      .eq("id", knowledge_base_id)
      .single();

    if (kbError || !knowledgeBase) {
      return new Response(
        JSON.stringify({ 
          error: "Knowledge base not found", 
          details: kbError 
        }),
        { headers: corsHeaders, status: 404 }
      );
    }

    // Get the embedding model from knowledge base config or use default
    const embeddingModel = knowledgeBase.config?.embedding_model || 'text-embedding-ada-002';
    
    // Generate embedding for the query
    const embedding = await generateEmbedding(query, embeddingModel);

    // Build the filters for the query
    let matchCondition = `knowledge_base_id = '${knowledge_base_id}'`;
    
    // Apply additional filters if provided
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (key && value !== undefined && value !== null) {
          // Handle metadata filters specially
          if (key.startsWith('metadata.')) {
            const metadataKey = key.replace('metadata.', '');
            matchCondition += ` AND metadata->>'${metadataKey}' = '${value}'`;
          }
        }
      });
    }

    // Query the document_chunks table using vector similarity search
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: embedding,
        match_threshold: similarity_threshold,
        match_count: limit,
        match_condition: matchCondition
      }
    );

    if (searchError) {
      console.error("Error in vector search:", searchError);
      return new Response(
        JSON.stringify({ 
          error: "Error performing vector search", 
          details: searchError 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Get document details for the chunks
    const documentIds = [...new Set(chunks.map(chunk => chunk.document_id))];
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("id, filename, file_type, metadata")
      .in("id", documentIds);
      
    if (docsError) {
      console.error("Error fetching document details:", docsError);
    }
    
    // Combine chunk results with document details
    const results = chunks.map(chunk => {
      const document = documents?.find(doc => doc.id === chunk.document_id) || null;
      return {
        ...chunk,
        document: document ? {
          id: document.id,
          filename: document.filename,
          file_type: document.file_type,
          metadata: document.metadata
        } : null
      };
    });

    // Return the results
    return new Response(
      JSON.stringify({ 
        results,
        query,
        knowledge_base_id,
        similarity_threshold,
        limit,
        filters
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error during vector search", 
        details: error.message 
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// Function to generate embeddings using the appropriate API
async function generateEmbedding(text: string, model: string): Promise<number[]> {
  let endpoint = 'https://api.openai.com/v1/embeddings';
  let headers = {
    'Authorization': `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
    'Content-Type': 'application/json',
  };
  let body = {
    input: text,
    model: model
  };
  
  // Handle different embedding models
  if (model === 'voyage-finance-2' || model === 'voyage-3-large') {
    // For Voyage AI models
    const voyageApiKey = Deno.env.get("VOYAGE_API_KEY");
    
    if (!voyageApiKey) {
      throw new Error('VOYAGE_API_KEY is not set');
    }
    
    endpoint = 'https://api.voyageai.com/v1/embeddings';
    headers = {
      'Authorization': `Bearer ${voyageApiKey}`,
      'Content-Type': 'application/json',
    };
    body = {
      input: text,
      model: model,
      dimensions: 1536 // Match OpenAI's dimensions for compatibility
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    // Handle different API response formats
    if (model === 'voyage-finance-2' || model === 'voyage-3-large') {
      return result.data[0].embedding;
    } else {
      return result.data[0].embedding;
    }
  } catch (error) {
    console.error(`Error generating embedding with model ${model}:`, error);
    throw error;
  }
}
