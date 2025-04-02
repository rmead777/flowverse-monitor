
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Serve the HTTP request
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!PINECONE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'PINECONE_API_KEY environment variable is not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Supabase environment variables are not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    const operation = requestData.operation;

    // Validate operation
    if (!operation) {
      return new Response(
        JSON.stringify({ error: 'Missing operation parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Executing Pinecone operation: ${operation}`);

    // Initialize Supabase client for data operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different operations
    switch (operation) {
      case 'list-indexes':
        return await listIndexes(PINECONE_API_KEY, corsHeaders);
      
      case 'describe-index':
        return await describeIndex(PINECONE_API_KEY, requestData.indexName, corsHeaders);
      
      case 'create-index':
        return await createIndex(PINECONE_API_KEY, requestData, corsHeaders);
      
      case 'delete-index':
        return await deleteIndex(PINECONE_API_KEY, requestData.indexName, corsHeaders);
        
      case 'list-namespaces':
        return await listNamespaces(PINECONE_API_KEY, requestData.indexName, corsHeaders);
        
      case 'get-stats':
        return await getStats(PINECONE_API_KEY, requestData.indexName, requestData.namespace, corsHeaders);
        
      case 'transfer-to-pinecone':
        return await transferToPinecone(
          PINECONE_API_KEY,
          supabase,
          requestData.knowledge_base_id,
          requestData.indexName,
          requestData.namespace,
          corsHeaders
        );
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in pinecone-operations function:', error);
    return new Response(
      JSON.stringify({ error: `Operation failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// List all Pinecone indexes
async function listIndexes(apiKey: string, corsHeaders: Record<string, string>) {
  try {
    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing Pinecone indexes:', error);
    return new Response(
      JSON.stringify({ error: `Failed to list indexes: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get details about a specific index
async function describeIndex(apiKey: string, indexName: string, corsHeaders: Record<string, string>) {
  if (!indexName) {
    return new Response(
      JSON.stringify({ error: 'Missing indexName parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error describing Pinecone index ${indexName}:`, error);
    return new Response(
      JSON.stringify({ error: `Failed to describe index: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Create a new Pinecone index
async function createIndex(
  apiKey: string, 
  params: {
    name: string;
    dimension: number;
    metric?: string;
    serverless?: boolean;
  },
  corsHeaders: Record<string, string>
) {
  const { name, dimension = 1536, metric = 'cosine', serverless = true } = params;

  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Missing name parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Build request body
    const requestBody: any = {
      name,
      dimension,
      metric
    };

    if (serverless) {
      requestBody.spec = { serverless: { cloud: 'aws', region: 'us-west-2' } };
    }

    console.log('Creating index with params:', requestBody);

    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone API error (${response.status}): ${errorText}`);
    }

    // Successfully initiated index creation
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Index ${name} creation initiated. It may take a few minutes to complete.` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Pinecone index:', error);
    return new Response(
      JSON.stringify({ error: `Failed to create index: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Delete a Pinecone index
async function deleteIndex(apiKey: string, indexName: string, corsHeaders: Record<string, string>) {
  if (!indexName) {
    return new Response(
      JSON.stringify({ error: 'Missing indexName parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: 'DELETE',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone API error (${response.status}): ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Index ${indexName} deleted successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error deleting Pinecone index ${indexName}:`, error);
    return new Response(
      JSON.stringify({ error: `Failed to delete index: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// List namespaces in a Pinecone index
async function listNamespaces(apiKey: string, indexName: string, corsHeaders: Record<string, string>) {
  if (!indexName) {
    return new Response(
      JSON.stringify({ error: 'Missing indexName parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // First, describe the index to get the host
    const describeResponse = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!describeResponse.ok) {
      const errorText = await describeResponse.text();
      throw new Error(`Pinecone API error (${describeResponse.status}): ${errorText}`);
    }

    const indexData = await describeResponse.json();
    const host = indexData.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

    // Now get the index stats to list namespaces
    const statsResponse = await fetch(`https://${host}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      throw new Error(`Pinecone API error (${statsResponse.status}): ${errorText}`);
    }

    const statsData = await statsResponse.json();
    
    // Extract namespaces from the stats response
    const namespaces = statsData.namespaces ? Object.keys(statsData.namespaces) : [];
    
    return new Response(
      JSON.stringify({ 
        namespaces,
        stats: statsData,
        totalVectorCount: statsData.totalVectorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error listing namespaces for Pinecone index ${indexName}:`, error);
    return new Response(
      JSON.stringify({ error: `Failed to list namespaces: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get stats for a Pinecone index or namespace
async function getStats(
  apiKey: string, 
  indexName: string, 
  namespace: string | undefined,
  corsHeaders: Record<string, string>
) {
  if (!indexName) {
    return new Response(
      JSON.stringify({ error: 'Missing indexName parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // First, describe the index to get the host
    const describeResponse = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!describeResponse.ok) {
      const errorText = await describeResponse.text();
      throw new Error(`Pinecone API error (${describeResponse.status}): ${errorText}`);
    }

    const indexData = await describeResponse.json();
    const host = indexData.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

    // Get index stats
    const requestBody: any = {};
    if (namespace) {
      requestBody.filter = { namespace };
    }

    const statsResponse = await fetch(`https://${host}/describe_index_stats`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      throw new Error(`Pinecone API error (${statsResponse.status}): ${errorText}`);
    }

    const statsData = await statsResponse.json();
    
    return new Response(
      JSON.stringify(statsData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error getting stats for Pinecone index ${indexName}:`, error);
    return new Response(
      JSON.stringify({ error: `Failed to get stats: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Transfer vectors from Supabase to Pinecone
async function transferToPinecone(
  apiKey: string,
  supabase: any,
  knowledgeBaseId: string,
  indexName: string,
  namespace: string,
  corsHeaders: Record<string, string>
) {
  if (!knowledgeBaseId || !indexName) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: knowledgeBaseId and indexName' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get knowledge base details
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('id', knowledgeBaseId)
      .single();

    if (kbError || !knowledgeBase) {
      throw new Error(`Knowledge base not found: ${kbError?.message || 'No data returned'}`);
    }

    // Describe the Pinecone index to get the host
    const describeResponse = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!describeResponse.ok) {
      const errorText = await describeResponse.text();
      throw new Error(`Pinecone API error (${describeResponse.status}): ${errorText}`);
    }

    const indexData = await describeResponse.json();
    const host = indexData.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

    // Count total chunks to transfer
    const { count: totalChunks, error: countError } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('knowledge_base_id', knowledgeBaseId);

    if (countError) {
      throw new Error(`Error counting document chunks: ${countError.message}`);
    }

    // Start background transfer process
    console.log(`Starting transfer of ${totalChunks} chunks to Pinecone index ${indexName}, namespace: ${namespace}`);

    // Update knowledge base config with Pinecone info
    const updatedConfig = {
      ...knowledgeBase.config,
      pineconeIndex: indexName,
      environment: indexData.environment || indexData.host.split('.')[2], // Extract env from host
      namespace: namespace
    };

    const { error: updateError } = await supabase
      .from('knowledge_bases')
      .update({ 
        config: updatedConfig,
        status: 'indexing'
      })
      .eq('id', knowledgeBaseId);

    if (updateError) {
      throw new Error(`Error updating knowledge base config: ${updateError.message}`);
    }

    // Initiate the background transfer process
    // We'll use a simple approach here - spawn a background task with waitUntil if available
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(
        transferChunksInBatches(
          supabase, 
          apiKey, 
          knowledgeBaseId, 
          host, 
          namespace, 
          totalChunks
        )
      );
    } else {
      // If waitUntil is not available, let the client know they should poll for status
      console.log('waitUntil not available, transfer will continue in background but may be interrupted');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Transfer of ${totalChunks} chunks to Pinecone initiated`,
        knowledgeBaseId,
        indexName,
        namespace,
        totalChunks 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error transferring to Pinecone:', error);
    return new Response(
      JSON.stringify({ error: `Transfer failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to transfer chunks in batches
async function transferChunksInBatches(
  supabase: any,
  apiKey: string,
  knowledgeBaseId: string,
  host: string,
  namespace: string,
  totalChunks: number
) {
  try {
    const batchSize = 100;
    let processedChunks = 0;
    let from = 0;
    
    while (processedChunks < totalChunks) {
      // Fetch a batch of chunks
      const { data: chunks, error: fetchError } = await supabase
        .from('document_chunks')
        .select('id, content, document_id, embedding, metadata')
        .eq('knowledge_base_id', knowledgeBaseId)
        .range(from, from + batchSize - 1);
        
      if (fetchError) {
        throw new Error(`Error fetching document chunks: ${fetchError.message}`);
      }
      
      if (!chunks || chunks.length === 0) {
        break;
      }
      
      // Prepare vectors for upsert
      const vectors = chunks.map(chunk => ({
        id: chunk.id,
        values: chunk.embedding,
        metadata: {
          ...chunk.metadata,
          content: chunk.content,
          document_id: chunk.document_id,
          knowledge_base_id: knowledgeBaseId
        }
      }));
      
      // Upsert vectors to Pinecone
      const upsertResponse = await fetch(`https://${host}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vectors,
          namespace
        }),
      });
      
      if (!upsertResponse.ok) {
        const errorText = await upsertResponse.text();
        throw new Error(`Pinecone upsert error (${upsertResponse.status}): ${errorText}`);
      }
      
      // Update progress
      processedChunks += chunks.length;
      from += batchSize;
      
      console.log(`Transferred ${processedChunks}/${totalChunks} chunks to Pinecone`);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Update knowledge base status to active
    await supabase
      .from('knowledge_bases')
      .update({ status: 'active' })
      .eq('id', knowledgeBaseId);
      
    console.log(`Transfer complete: ${processedChunks} chunks transferred to Pinecone`);
    
    return { success: true, processedChunks };
  } catch (error) {
    console.error('Error in background transfer:', error);
    
    // Update knowledge base to indicate error
    await supabase
      .from('knowledge_bases')
      .update({ 
        status: 'error',
        config: supabase.rpc('jsonb_set', { 
          target: knowledgeBaseId,
          path: '{error}',
          value: error.message
        })
      })
      .eq('id', knowledgeBaseId);
      
    return { success: false, error: error.message };
  }
}
