
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/+esm";

// Add more robust error logging at the start of the function
console.log('Starting document processing');
console.log('OpenAI API Key present:', !!Deno.env.get('OPENAI_API_KEY'));
console.log('Pinecone API Key present:', !!Deno.env.get('PINECONE_API_KEY'));

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
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
  
  // Validate required environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
    console.error('Missing required environment variables:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAiKey: !!OPENAI_API_KEY
    });
    return new Response(
      JSON.stringify({ error: 'Server configuration error - missing environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Initialize Supabase client with service role for admin privileges
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { documentId } = await req.json();
    console.log(`Processing document with ID: ${documentId}`);

    if (!documentId) {
      console.error('No document ID provided');
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get document details from database
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*, knowledge_base_id, file_path, file_type')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      console.error('Error fetching document:', fetchError || 'No document found');
      return new Response(
        JSON.stringify({ error: fetchError?.message || 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get knowledge base details
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*, config')
      .eq('id', document.knowledge_base_id)
      .single();

    if (kbError || !knowledgeBase) {
      console.error('Error fetching knowledge base:', kbError || 'No knowledge base found');
      return new Response(
        JSON.stringify({ error: kbError?.message || 'Knowledge base not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the file from storage
    console.log(`Downloading file from path: ${document.file_path}`);
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      await updateDocumentStatus(supabase, documentId, 'failed');
      return new Response(
        JSON.stringify({ error: downloadError?.message || 'Failed to download document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the document based on file type
    let textContent = '';
    try {
      if (document.file_type === 'application/pdf') {
        textContent = await extractTextFromPdf(fileData);
      } else if (document.file_type === 'text/plain') {
        textContent = await fileData.text();
      } else {
        throw new Error(`Unsupported file type: ${document.file_type}`);
      }
      
      console.log(`Successfully extracted text of length: ${textContent.length}`);
    } catch (extractError) {
      console.error('Error extracting text from document:', extractError);
      await updateDocumentStatus(supabase, documentId, 'failed');
      return new Response(
        JSON.stringify({ error: `Failed to extract text: ${extractError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Split text into chunks
    const chunks = splitIntoChunks(textContent);
    console.log(`Split document into ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        // Create embedding using OpenAI
        const embedding = await createEmbedding(chunk, OPENAI_API_KEY);
        
        // Store chunk and embedding in database
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            knowledge_base_id: document.knowledge_base_id,
            content: chunk,
            embedding: embedding,
            metadata: {
              ...document.metadata,
              chunk_index: i,
              document_type: document.file_type
            }
          });

        if (insertError) {
          console.error(`Error inserting chunk ${i}:`, insertError);
          throw insertError;
        }
      } catch (embeddingError) {
        console.error(`Error processing chunk ${i}:`, embeddingError);
        await updateDocumentStatus(supabase, documentId, 'failed');
        return new Response(
          JSON.stringify({ error: `Failed to process chunk ${i}: ${embeddingError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update document status to processed
    await updateDocumentStatus(supabase, documentId, 'processed');
    console.log(`Document ${documentId} successfully processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId, 
        chunks: chunks.length,
        message: 'Document processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: `Failed to process document: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateDocumentStatus(supabase, documentId, status) {
  console.log(`Updating document ${documentId} status to ${status}`);
  const { error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', documentId);
  
  if (error) {
    console.error('Error updating document status:', error);
  }
}

async function extractTextFromPdf(fileData) {
  const typedArray = new Uint8Array(await fileData.arrayBuffer());
  
  // Loading the PDF document using pdfjs
  const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
  let text = '';
  
  // Extracting text from each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + ' ';
  }
  
  return text.trim();
}

function splitIntoChunks(text, maxChunkSize = 1000, overlap = 100) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
    const chunk = words.slice(i, i + maxChunkSize).join(' ');
    chunks.push(chunk);
  }
  
  return chunks;
}

async function createEmbedding(text, apiKey) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
