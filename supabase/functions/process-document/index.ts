
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
    // Parse request body
    let documentId;
    try {
      const requestData = await req.json();
      documentId = requestData.documentId;
      console.log(`Processing document with ID: ${documentId}`);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format - expected JSON with documentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('Knowledge base config:', knowledgeBase.config);

    // Download the file from storage
    console.log(`Downloading file from path: ${document.file_path}`);
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      await updateDocumentStatus(supabase, documentId, 'failed', 'Failed to download document');
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
      } else if (document.file_type === 'text/plain' || document.file_type.includes('text')) {
        textContent = await fileData.text();
      } else {
        throw new Error(`Unsupported file type: ${document.file_type}`);
      }
      
      console.log(`Successfully extracted text of length: ${textContent.length}`);
      
      if (textContent.length === 0) {
        throw new Error('Extracted text is empty');
      }
    } catch (extractError) {
      console.error('Error extracting text from document:', extractError);
      await updateDocumentStatus(supabase, documentId, 'failed', `Failed to extract text: ${extractError.message}`);
      return new Response(
        JSON.stringify({ error: `Failed to extract text: ${extractError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update document to processing status
    await updateDocumentStatus(supabase, documentId, 'processing');

    // Split text into chunks
    const chunks = splitIntoChunks(textContent);
    console.log(`Split document into ${chunks.length} chunks`);

    let successfulChunks = 0;
    let failedChunks = 0;

    // Process chunks in batches to avoid overwhelming the embedding API
    const batchSize = 5;
    const totalBatches = Math.ceil(chunks.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, chunks.length);
      const batchChunks = chunks.slice(startIdx, endIdx);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (chunks ${startIdx} to ${endIdx-1})`);
      
      const batchPromises = batchChunks.map(async (chunk, index) => {
        const globalIndex = startIdx + index;
        try {
          // Only create embedding if chunk has content
          if (chunk.trim().length === 0) {
            console.warn(`Chunk ${globalIndex} is empty, skipping`);
            return { success: false, error: 'Empty chunk' };
          }
          
          // Create embedding using OpenAI
          const embedding = await createEmbedding(chunk, OPENAI_API_KEY);
          if (!embedding || embedding.length === 0) {
            throw new Error('Failed to generate embedding - empty result');
          }
          
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
                chunk_index: globalIndex,
                document_name: document.filename,
                document_type: document.file_type
              }
            });

          if (insertError) {
            console.error(`Error inserting chunk ${globalIndex}:`, insertError);
            throw insertError;
          }
          
          return { success: true };
        } catch (chunkError) {
          console.error(`Error processing chunk ${globalIndex}:`, chunkError);
          return { success: false, error: chunkError.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Count successes and failures
      batchResults.forEach(result => {
        if (result.success) {
          successfulChunks++;
        } else {
          failedChunks++;
        }
      });
      
      // Add delay between batches to avoid rate limits
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update document status based on processing results
    let finalStatus = 'processed';
    let statusMessage = `Processed ${successfulChunks} chunks successfully`;
    
    if (successfulChunks === 0) {
      finalStatus = 'failed';
      statusMessage = 'Failed to process any chunks';
    } else if (failedChunks > 0) {
      finalStatus = 'partially_processed';
      statusMessage = `Processed ${successfulChunks} chunks, failed ${failedChunks} chunks`;
    }
    
    await updateDocumentStatus(supabase, documentId, finalStatus, statusMessage);
    console.log(`Document ${documentId} ${finalStatus}: ${statusMessage}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId, 
        chunks: chunks.length,
        successful: successfulChunks,
        failed: failedChunks,
        status: finalStatus,
        message: statusMessage
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

async function updateDocumentStatus(supabase, documentId, status, message = null) {
  console.log(`Updating document ${documentId} status to ${status}${message ? ': ' + message : ''}`);
  
  const updates = { status };
  if (message) {
    updates.metadata = { processing_message: message };
  }
  
  const { error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId);
  
  if (error) {
    console.error('Error updating document status:', error);
  }
}

async function extractTextFromPdf(fileData) {
  try {
    const typedArray = new Uint8Array(await fileData.arrayBuffer());
    
    // Force setting global.window to prevent PDF.js worker errors
    if (typeof globalThis.window === 'undefined') {
      // @ts-ignore
      globalThis.window = { pdfjsWorker: {} };
    }
    
    // Loading the PDF document using pdfjs
    const loadingTask = pdfjs.getDocument({ data: typedArray });
    const pdf = await loadingTask.promise;
    let text = '';
    
    // Extracting text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + ' ';
        console.log(`Extracted text from page ${i} of ${pdf.numPages}`);
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        // Continue with next page instead of failing the entire process
      }
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error in PDF extraction:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

function splitIntoChunks(text, maxChunkSize = 1000, overlap = 100) {
  if (!text || text.length === 0) {
    console.warn('Empty text provided for chunking');
    return [""];
  }
  
  // First clean the text (remove excessive whitespace)
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  // For very short texts, just return as a single chunk
  if (cleanedText.length <= maxChunkSize) {
    return [cleanedText];
  }
  
  const words = cleanedText.split(/\s+/);
  
  if (words.length === 0) {
    console.warn('No words found in text for chunking');
    return [""];
  }
  
  const chunks = [];
  
  for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
    const chunk = words.slice(i, i + maxChunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }
  
  // If we somehow ended up with no chunks, return the original text
  if (chunks.length === 0) {
    return [cleanedText];
  }
  
  return chunks;
}

async function createEmbedding(text, apiKey) {
  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided for embedding');
    // Return a zero vector of the correct dimension for the model instead of throwing
    return new Array(1536).fill(0);
  }
  
  try {
    // Trim text to avoid token limits (OpenAI has an 8k token limit for text-embedding-ada-002)
    const trimmedText = text.slice(0, 8000);
    
    console.log(`Creating embedding for text of length ${trimmedText.length}`);
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: trimmedText,
        model: 'text-embedding-ada-002'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: `HTTP error ${response.status}` }}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      console.error('Unexpected embedding response format:', data);
      throw new Error('Invalid embedding response format from OpenAI');
    }
    
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}
