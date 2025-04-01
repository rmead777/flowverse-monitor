
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import { extract as extractPdf } from "https://esm.sh/pdf-parse@1.1.1";
import { encode } from "https://deno.land/std@0.188.0/encoding/base64.ts";

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
    const { document_id } = await req.json();
    
    if (!document_id) {
      return new Response(
        JSON.stringify({ 
          error: "Missing document_id in request body" 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    console.log(`Processing document: ${document_id}`);

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the document information
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("*, knowledge_bases!inner(*)")
      .eq("id", document_id)
      .single();

    if (documentError || !document) {
      console.error("Error fetching document:", documentError);
      return new Response(
        JSON.stringify({ 
          error: "Document not found", 
          details: documentError 
        }),
        { headers: corsHeaders, status: 404 }
      );
    }

    console.log(`Document found: ${document.filename}, type: ${document.file_type}`);

    // Download the document content
    const { data: fileData, error: fileError } = await supabase.storage
      .from("documents")
      .download(document.file_path);

    if (fileError || !fileData) {
      console.error("Error downloading file:", fileError);
      
      // Update document status to failed
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", document_id);
        
      return new Response(
        JSON.stringify({ 
          error: "Error downloading document file", 
          details: fileError 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    console.log(`File downloaded successfully, size: ${fileData.size} bytes`);

    // Process the document based on its type
    let textContent = "";
    
    if (document.file_type === "application/pdf") {
      try {
        const pdfData = await extractPdf(fileData);
        textContent = pdfData.text;
        console.log(`Extracted ${textContent.length} characters from PDF`);
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
        await supabase
          .from("documents")
          .update({ status: "failed" })
          .eq("id", document_id);
          
        return new Response(
          JSON.stringify({ 
            error: "Error extracting text from PDF", 
            details: error.message 
          }),
          { headers: corsHeaders, status: 500 }
        );
      }
    } else if (document.file_type === "text/plain") {
      textContent = await fileData.text();
      console.log(`Extracted ${textContent.length} characters from text file`);
    } else {
      // For unsupported file types, store a message
      textContent = `Unsupported file type: ${document.file_type}`;
      console.log(textContent);
    }

    // Chunk the text into smaller segments (500 words with 50 word overlap)
    const chunks = chunkText(textContent, 500, 50);
    console.log(`Created ${chunks.length} chunks from document`);

    // Generate embeddings and store chunks
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const embeddingModel = document.knowledge_bases?.config?.embedding_model || "text-embedding-ada-002";
    
    // Delete any existing chunks for this document
    const { error: deleteError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", document_id);
      
    if (deleteError) {
      console.error("Error deleting existing chunks:", deleteError);
    }
    
    // Process and store chunks in batches to avoid timeout
    const batchSize = 5;
    let processedChunks = 0;
    let storedChunks = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const embeddings = await Promise.all(
        batchChunks.map(async (chunk, index) => {
          try {
            return {
              embedding: await generateEmbedding(chunk, openaiApiKey, embeddingModel),
              content: chunk,
              chunkIndex: i + index,
            };
          } catch (error) {
            console.error(`Error generating embedding for chunk ${i + index}:`, error);
            return null;
          }
        })
      );
      
      // Filter out failed embeddings
      const validEmbeddings = embeddings.filter(e => e !== null);
      
      // Insert chunks with embeddings
      for (const { embedding, content, chunkIndex } of validEmbeddings) {
        const metadata = { 
          source: document.filename,
          chunk_index: chunkIndex,
          page: Math.floor(chunkIndex / 2) + 1 // Approximate page number
        };

        const { data: chunkData, error: chunkError } = await supabase
          .from("document_chunks")
          .insert({
            document_id: document_id,
            knowledge_base_id: document.knowledge_base_id,
            content: content,
            embedding: embedding,
            metadata: metadata
          })
          .select();
          
        if (chunkError) {
          console.error(`Error inserting chunk ${chunkIndex}:`, chunkError);
        } else {
          processedChunks++;
          if (chunkData && chunkData.length > 0) {
            storedChunks.push(chunkData[0]);
          }
        }
      }
      
      console.log(`Processed ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);
    }

    // If this is a Pinecone knowledge base, also send the chunks to Pinecone
    if (document.knowledge_bases?.type === "pinecone" && 
        document.knowledge_bases?.config?.pineconeIndex &&
        storedChunks.length > 0) {
      
      const pineconeApiKey = Deno.env.get("PINECONE_API_KEY");
      if (pineconeApiKey) {
        await sendChunksToPinecone(
          pineconeApiKey,
          document.knowledge_bases.config.pineconeIndex,
          document.knowledge_bases.config.pineconeNamespace || "",
          storedChunks
        );
      }
    }

    // Update document status based on processing results
    const status = processedChunks > 0 ? "processed" : "failed";
    const { error: updateError } = await supabase
      .from("documents")
      .update({ 
        status,
        metadata: {
          ...document.metadata,
          chunk_count: processedChunks,
          processed_at: new Date().toISOString()
        }
      })
      .eq("id", document_id);

    if (updateError) {
      console.error("Error updating document status:", updateError);
      return new Response(
        JSON.stringify({ 
          error: "Error updating document status", 
          details: updateError 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Document processed successfully. Created ${processedChunks} chunks.`,
        document_id,
        chunk_count: processedChunks
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error processing document", 
        details: error.message 
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// Function to chunk text into segments with overlap
function chunkText(text: string, wordCount: number, overlapSize: number): string[] {
  // Split the text into words
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  // Create chunks with the specified word count and overlap
  for (let i = 0; i < words.length; i += wordCount - overlapSize) {
    const chunk = words.slice(i, i + wordCount).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    
    // Break if we've processed all words
    if (i + wordCount >= words.length) {
      break;
    }
  }
  
  return chunks;
}

// Function to generate embeddings using OpenAI API
async function generateEmbedding(text: string, apiKey: string, model: string): Promise<number[]> {
  let endpoint = 'https://api.openai.com/v1/embeddings';
  let headers = {
    'Authorization': `Bearer ${apiKey}`,
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
  } else if (model === 'sentence-transformers') {
    // Use a local HuggingFace model or service for sentence transformers
    // This is a placeholder and would need a proper implementation
    throw new Error('sentence-transformers model not implemented');
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

// Function to send chunks to Pinecone
async function sendChunksToPinecone(
  apiKey: string,
  indexName: string,
  namespace: string,
  chunks: any[]
) {
  try {
    // Get index description to get the host
    const describeResponse = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
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

    // Batch size for upserts (Pinecone has limits)
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    // Format vectors for Pinecone
    const vectors = chunks.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding,
      metadata: {
        ...chunk.metadata,
        content: chunk.content,
        document_id: chunk.document_id,
        knowledge_base_id: chunk.knowledge_base_id
      }
    }));

    // Process in batches
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      
      const upsertBody = {
        vectors: batch,
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

    console.log(`Pinecone upload summary: ${successCount} successful, ${errorCount} failed`);
    return { success: true, successCount, errorCount };
  } catch (error) {
    console.error("Error sending chunks to Pinecone:", error);
    throw error;
  }
}
