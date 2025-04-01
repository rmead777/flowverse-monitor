
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
    const { document_id } = await req.json();
    
    if (!document_id) {
      return new Response(
        JSON.stringify({ 
          error: "Missing document_id in request body" 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

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

    // Process the document based on its type
    // In a real implementation, you would:
    // 1. Extract text from PDF or read text files
    // 2. Chunk the text into smaller segments
    // 3. Generate embeddings for each chunk
    // 4. Store the chunks in the document_chunks table
    
    // For this example, we'll create a single chunk with the file name as content
    // and set the document status to processed
    
    // Create a simple placeholder chunk
    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert({
        document_id: document_id,
        knowledge_base_id: document.knowledge_base_id,
        content: `Processed content from ${document.filename}`,
        metadata: { 
          source: document.filename,
          page: 1
        }
      });

    if (chunkError) {
      console.error("Error creating document chunk:", chunkError);
      
      // Update document status to failed
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", document_id);
        
      return new Response(
        JSON.stringify({ 
          error: "Error creating document chunk", 
          details: chunkError 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Update document status to processed
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: "processed" })
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
        message: "Document processed successfully",
        document_id
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
