
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
    const requestData = await req.json();
    const { operation, knowledge_base_id, ...params } = requestData;
    
    if (!operation) {
      return new Response(
        JSON.stringify({ 
          error: "Missing operation in request body" 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    console.log(`Pinecone operation: ${operation}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the Pinecone API key
    const pineconeApiKey = Deno.env.get("PINECONE_API_KEY") as string;
    if (!pineconeApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "PINECONE_API_KEY not set in environment" 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    let response;

    switch (operation) {
      case "list-indexes":
        response = await listPineconeIndexes(pineconeApiKey);
        break;

      case "create-index":
        response = await createPineconeIndex(pineconeApiKey, params);
        break;

      case "describe-index":
        response = await describePineconeIndex(pineconeApiKey, params.indexName);
        break;

      case "delete-index":
        response = await deletePineconeIndex(pineconeApiKey, params.indexName);
        break;

      case "list-namespaces":
        response = await listNamespaces(pineconeApiKey, params.indexName);
        break;

      case "get-stats":
        response = await getIndexStats(pineconeApiKey, params.indexName, params.namespace);
        break;

      case "transfer-to-pinecone":
        response = await transferToPinecone(
          supabase, 
          pineconeApiKey, 
          knowledge_base_id, 
          params.indexName, 
          params.namespace
        );
        break;

      default:
        return new Response(
          JSON.stringify({ 
            error: `Unknown operation: ${operation}` 
          }),
          { headers: corsHeaders, status: 400 }
        );
    }

    return new Response(
      JSON.stringify(response),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error during Pinecone operation", 
        details: error.message 
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

async function listPineconeIndexes(apiKey: string) {
  try {
    const response = await fetch("https://api.pinecone.io/indexes", {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error listing Pinecone indexes:", error);
    throw error;
  }
}

async function createPineconeIndex(apiKey: string, params: any) {
  const { 
    name, 
    dimension = 1536, 
    metric = "cosine", 
    serverless = true,
    cloud = "aws", 
    region = "us-west-2", 
    spec 
  } = params;

  // Build request body based on whether it's serverless or pod-based
  let requestBody: any = {
    name,
    dimension,
    metric,
  };

  if (serverless) {
    requestBody.spec = {
      serverless: {
        cloud,
        region,
      }
    };
  } else if (spec) {
    requestBody.spec = {
      pod: {
        environment: spec.environment,
        replicas: spec.replicas,
        shards: spec.shards,
        pods: spec.pods,
      }
    };
  }

  try {
    const response = await fetch("https://api.pinecone.io/indexes", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Pinecone index:", error);
    throw error;
  }
}

async function describePineconeIndex(apiKey: string, indexName: string) {
  try {
    const response = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error describing Pinecone index ${indexName}:`, error);
    throw error;
  }
}

async function deletePineconeIndex(apiKey: string, indexName: string) {
  try {
    const response = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: "DELETE",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting Pinecone index ${indexName}:`, error);
    throw error;
  }
}

async function listNamespaces(apiKey: string, indexName: string) {
  try {
    // Get index description to get the host
    const describeResponse = await describePineconeIndex(apiKey, indexName);
    const host = describeResponse.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

    const response = await fetch(`https://${host}/describe_index_stats`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      namespaces: Object.keys(data.namespaces || {}),
      stats: data
    };
  } catch (error) {
    console.error(`Error listing namespaces for index ${indexName}:`, error);
    throw error;
  }
}

async function getIndexStats(apiKey: string, indexName: string, namespace?: string) {
  try {
    // Get index description to get the host
    const describeResponse = await describePineconeIndex(apiKey, indexName);
    const host = describeResponse.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

    const requestBody: any = {};
    if (namespace) {
      requestBody.filter = { namespace };
    }

    const response = await fetch(`https://${host}/describe_index_stats`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting stats for index ${indexName}:`, error);
    throw error;
  }
}

async function transferToPinecone(
  supabase: any, 
  apiKey: string, 
  knowledgeBaseId: string, 
  indexName: string, 
  namespace: string
) {
  try {
    // Get knowledge base details
    const { data: knowledgeBase, error: kbError } = await supabase
      .from("knowledge_bases")
      .select("*")
      .eq("id", knowledgeBaseId)
      .single();

    if (kbError || !knowledgeBase) {
      throw new Error(`Knowledge base not found: ${kbError?.message || "No data"}`);
    }

    // Update knowledge base status to indexing
    const { error: updateError } = await supabase
      .from("knowledge_bases")
      .update({ status: "indexing" })
      .eq("id", knowledgeBaseId);

    if (updateError) {
      throw new Error(`Error updating knowledge base status: ${updateError.message}`);
    }

    // Get all document chunks for this knowledge base
    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("id, content, document_id, embedding, metadata")
      .eq("knowledge_base_id", knowledgeBaseId);

    if (chunksError) {
      throw new Error(`Error fetching document chunks: ${chunksError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      throw new Error("No document chunks found for this knowledge base");
    }

    console.log(`Found ${chunks.length} chunks to transfer to Pinecone`);

    // Get index description to get the host
    const describeResponse = await describePineconeIndex(apiKey, indexName);
    const host = describeResponse.host;
    
    if (!host) {
      throw new Error(`No host found for index ${indexName}`);
    }

    // Batch size for upserts (Pinecone has limits)
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Format vectors for Pinecone
      const vectors = batch.map(chunk => ({
        id: chunk.id,
        values: chunk.embedding,
        metadata: {
          ...chunk.metadata,
          content: chunk.content,
          document_id: chunk.document_id
        }
      }));

      const upsertBody = {
        vectors,
        namespace
      };

      try {
        const response = await fetch(`https://${host}/vectors/upsert`, {
          method: "POST",
          headers: {
            "Api-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(upsertBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Batch ${i / batchSize} failed: ${errorText}`);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`Batch ${i / batchSize} success: ${batch.length} vectors`);
        }
      } catch (batchError) {
        console.error(`Error in batch ${i / batchSize}:`, batchError);
        errorCount += batch.length;
      }
    }

    // Update knowledge base with Pinecone config and set status to active
    const updatedConfig = {
      ...knowledgeBase.config,
      pineconeIndex: indexName,
      pineconeNamespace: namespace,
      embedding_model: knowledgeBase.config?.embedding_model || "text-embedding-ada-002"
    };

    const { error: finalUpdateError } = await supabase
      .from("knowledge_bases")
      .update({ 
        status: "active",
        config: updatedConfig,
        type: "pinecone" // Ensure type is set to pinecone
      })
      .eq("id", knowledgeBaseId);

    if (finalUpdateError) {
      throw new Error(`Error updating knowledge base config: ${finalUpdateError.message}`);
    }

    return {
      success: true,
      totalChunks: chunks.length,
      successCount,
      errorCount,
      index: indexName,
      namespace
    };
  } catch (error) {
    console.error("Error transferring to Pinecone:", error);
    
    // Update knowledge base status to error
    await supabase
      .from("knowledge_bases")
      .update({ status: "error" })
      .eq("id", knowledgeBaseId);
      
    throw error;
  }
}
