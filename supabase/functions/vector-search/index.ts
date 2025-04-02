
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

// Define the function handler
serve(async (req: Request) => {
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
    console.log("Vector search function invoked");
    
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

    // Get knowledge base details to determine search method and embedding model
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

    console.log("Knowledge base config:", knowledgeBase.config);

    // Get the embedding model from knowledge base config or use default
    const embeddingModel = knowledgeBase.config?.embedding_model || 'text-embedding-ada-002';
    
    // Generate embedding for the query
    const embedding = await generateEmbedding(query, embeddingModel);
    
    if (!embedding) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate embedding for the query" 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Perform search based on knowledge base type
    let results = [];
    
    if (knowledgeBase.type === 'pinecone' && 
        knowledgeBase.config?.pineconeIndex && 
        knowledgeBase.config?.environment) {
      console.log("Using Pinecone search with index:", knowledgeBase.config.pineconeIndex);
      // Search using Pinecone
      results = await searchPinecone(
        knowledgeBase,
        embedding,
        limit,
        similarity_threshold,
        filters
      );
    } else {
      console.log("Using Supabase pgvector search");
      // Search using Supabase pgvector
      results = await searchSupabase(
        supabase,
        knowledge_base_id,
        embedding,
        limit,
        similarity_threshold,
        filters
      );
    }

    console.log(`Search returned ${results.length} results`);

    // Get document details for the chunks if needed
    if (results.length > 0 && !results[0].document) {
      const documentIds = [...new Set(results.map(chunk => chunk.document_id))];
      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("id, filename, file_type, metadata")
        .in("id", documentIds);
        
      if (docsError) {
        console.error("Error fetching document details:", docsError);
      } else if (documents) {
        // Combine chunk results with document details
        results = results.map(chunk => {
          const document = documents.find(doc => doc.id === chunk.document_id) || null;
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
      }
    }

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

// Function to search using Supabase pgvector
async function searchSupabase(
  supabase: any,
  knowledgeBaseId: string,
  embedding: number[],
  limit: number,
  similarityThreshold: number,
  filters: Record<string, any>
) {
  // Build the filters for the query
  let matchCondition = `knowledge_base_id = '${knowledgeBaseId}'`;
  
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

  console.log("Querying with match condition:", matchCondition);

  try {
    // Try to use the match_documents RPC function if available
    try {
      const { data: rpcResults, error: rpcError } = await supabase.rpc(
        'match_documents',
        {
          query_embedding: embedding,
          match_threshold: similarityThreshold,
          match_count: limit,
          filter_expression: matchCondition
        }
      );
      
      if (!rpcError && rpcResults) {
        console.log(`Found ${rpcResults.length} results using match_documents RPC`);
        return rpcResults;
      }
    } catch (rpcError) {
      console.log("RPC method not available, falling back to direct query:", rpcError.message);
    }

    // Fall back to direct query if the RPC function isn't available
    const { data: chunks, error: directQueryError } = await supabase
      .from('document_chunks')
      .select('id, content, document_id, knowledge_base_id, metadata')
      .eq('knowledge_base_id', knowledgeBaseId)
      .limit(limit);

    if (directQueryError) {
      console.error("Error in direct document_chunks query:", directQueryError);
      throw directQueryError;
    }

    console.log(`Found ${chunks?.length || 0} results using direct query`);
    return chunks || [];
  } catch (error) {
    console.error("Error in Supabase vector search:", error);
    // Return empty results rather than failing completely
    return [];
  }
}

// Function to search using Pinecone
async function searchPinecone(
  knowledgeBase: any,
  embedding: number[],
  limit: number,
  similarityThreshold: number,
  filters: Record<string, any>
) {
  try {
    const pineconeApiKey = Deno.env.get("PINECONE_API_KEY") as string;
    if (!pineconeApiKey) {
      throw new Error("PINECONE_API_KEY not set in environment");
    }

    const indexName = knowledgeBase.config?.pineconeIndex;
    const environment = knowledgeBase.config?.environment;
    const namespace = knowledgeBase.config?.namespace || "";
    
    if (!indexName) {
      throw new Error("Pinecone index name not found in knowledge base config");
    }

    if (!environment) {
      throw new Error("Pinecone environment not found in knowledge base config");
    }

    console.log(`Searching Pinecone index: ${indexName}, environment: ${environment}, namespace: ${namespace}`);

    // Build the host URL
    const host = `${indexName}-${environment}.svc.${environment}.pinecone.io`;
    
    // Build filter if any
    const metadataFilter: Record<string, any> = {};
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (key && value !== undefined && value !== null && key.startsWith('metadata.')) {
          const metadataKey = key.replace('metadata.', '');
          metadataFilter[metadataKey] = value;
        }
      });
    }

    // Always include knowledge_base_id in the filter
    metadataFilter.knowledge_base_id = knowledgeBase.id;

    console.log("Pinecone metadata filter:", metadataFilter);

    // Query the Pinecone index
    const requestBody: any = {
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      includeValues: false
    };

    if (namespace) {
      requestBody.namespace = namespace;
    }

    if (Object.keys(metadataFilter).length > 0) {
      requestBody.filter = { $and: [metadataFilter] };
    }

    console.log(`Querying Pinecone at https://${host}/query with:`, JSON.stringify(requestBody));

    const searchResponse = await fetch(`https://${host}/query`, {
      method: "POST",
      headers: {
        "Api-Key": pineconeApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Pinecone search request failed with status ${searchResponse.status}: ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log(`Pinecone returned ${searchData.matches?.length || 0} matches`);
    
    // Convert Pinecone results to our standard format
    return (searchData.matches || [])
      .filter((match: any) => match.score >= similarityThreshold)
      .map((match: any) => ({
        id: match.id,
        content: match.metadata?.content || "",
        document_id: match.metadata?.document_id || null,
        knowledge_base_id: knowledgeBase.id,
        metadata: match.metadata || {},
        similarity: match.score,
        document: null  // Will be populated later
      }));
  } catch (error) {
    console.error("Error in Pinecone search:", error);
    throw error;
  }
}

// Function to generate embeddings using the appropriate API
async function generateEmbedding(text: string, model: string): Promise<number[] | null> {
  console.log(`Generating embedding using model: ${model}`);
  
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
  if (model.startsWith('voyage-')) {
    // For Voyage AI models
    const voyageApiKey = Deno.env.get("VOYAGE_API_KEY");
    
    if (!voyageApiKey) {
      console.error('VOYAGE_API_KEY is not set, falling back to OpenAI');
      model = 'text-embedding-ada-002';
    } else {
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
  }

  try {
    console.log(`Making request to ${endpoint} with model ${model}`);
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
    console.log("Embedding generated successfully");
    
    if (!result.data || !result.data[0] || !result.data[0].embedding) {
      console.error("Invalid embedding response format:", result);
      return null;
    }
    
    return result.data[0].embedding;
  } catch (error) {
    console.error(`Error generating embedding with model ${model}:`, error);
    return null;
  }
}
