
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

    // Perform search based on knowledge base type
    let results = [];
    
    if (knowledgeBase.type === 'pinecone') {
      console.log("Using Pinecone search");
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

  try {
    // First check if the match_document_chunks function exists
    const { data: funcExists, error: funcCheckError } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: embedding,
        match_threshold: similarityThreshold,
        match_count: limit,
        match_condition: matchCondition
      }
    );

    if (funcCheckError && funcCheckError.message.includes('does not exist')) {
      // If the function doesn't exist, fallback to direct query
      console.log('match_document_chunks function does not exist, using direct query instead');

      const { data: chunks, error: directQueryError } = await supabase
        .from('document_chunks')
        .select('id, content, document_id, knowledge_base_id, metadata')
        .eq('knowledge_base_id', knowledgeBaseId)
        .limit(limit);

      if (directQueryError) {
        console.error("Error in direct document_chunks query:", directQueryError);
        throw directQueryError;
      }

      // Since we can't do similarity search without the function, just return all chunks
      return chunks || [];
    } else if (funcCheckError) {
      console.error("Error checking match_document_chunks function:", funcCheckError);
      throw funcCheckError;
    }

    // If we got here, the function exists and we got results
    return funcExists || [];
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
    const namespace = knowledgeBase.config?.pineconeNamespace || "";
    
    if (!indexName) {
      throw new Error("Pinecone index name not found in knowledge base config");
    }

    // Get index description to get the host
    const describeResponse = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: "GET",
      headers: {
        "Api-Key": pineconeApiKey,
        "Content-Type": "application/json",
      },
    });

    if (!describeResponse.ok) {
      const errorText = await describeResponse.text();
      throw new Error(`API request failed with status ${describeResponse.status}: ${errorText}`);
    }

    const indexData = await describeResponse.json();
    const host = indexData.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

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

    // Query the Pinecone index
    const requestBody: any = {
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      namespace
    };

    if (Object.keys(metadataFilter).length > 0) {
      requestBody.filter = metadataFilter;
    }

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
      throw new Error(`Search request failed with status ${searchResponse.status}: ${errorText}`);
    }

    const searchData = await searchResponse.json();
    
    // Convert Pinecone results to our standard format
    return (searchData.matches || [])
      .filter((match: any) => match.score >= similarityThreshold)
      .map((match: any) => ({
        id: match.id,
        content: match.metadata.content,
        document_id: match.metadata.document_id,
        knowledge_base_id: knowledgeBase.id,
        metadata: match.metadata,
        similarity: match.score,
        document: null  // Will be populated later
      }));
  } catch (error) {
    console.error("Error in Pinecone search:", error);
    throw error;
  }
}

// Function to generate embeddings using the appropriate API
async function generateEmbedding(text: string, model: string): Promise<number[]> {
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
    console.log(`Making request to ${endpoint}`);
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
