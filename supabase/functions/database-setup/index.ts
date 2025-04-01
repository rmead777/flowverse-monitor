
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
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SQL to create the vector similarity search function
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create function for cosine similarity search on document chunks
        CREATE OR REPLACE FUNCTION match_document_chunks(
          query_embedding vector,
          match_threshold float,
          match_count int,
          match_condition text
        )
        RETURNS TABLE (
          id uuid,
          document_id uuid,
          content text,
          metadata jsonb,
          similarity float
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            dc.id,
            dc.document_id,
            dc.content,
            dc.metadata,
            1 - (dc.embedding <=> query_embedding) as similarity
          FROM
            document_chunks dc
          WHERE
            1 - (dc.embedding <=> query_embedding) > match_threshold
            AND dc.embedding IS NOT NULL
            AND CASE WHEN match_condition IS NULL OR match_condition = '' THEN true ELSE (match_condition)::boolean END
          ORDER BY
            dc.embedding <=> query_embedding
          LIMIT
            match_count;
        END;
        $$;

        -- Create CREATE extension if it doesn't exist
        CREATE EXTENSION IF NOT EXISTS vector;

        -- Create an index for faster similarity searches if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE indexname = 'document_chunks_embedding_idx'
          ) THEN
            CREATE INDEX document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
          END IF;
        END
        $$;
      `
    });

    if (error) {
      console.error("Error setting up database functions:", error);
      return new Response(
        JSON.stringify({ 
          error: "Error setting up database functions", 
          details: error 
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Database functions for vector search set up successfully"
      }),
      { headers: corsHeaders, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error setting up database", 
        details: error.message 
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
