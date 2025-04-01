
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeBase, KnowledgeBaseType, DocumentFile, PineconeIndex, PineconeStat } from "@/types/knowledgeBase";
import { v4 as uuidv4 } from "uuid";

// Type guard for knowledge base objects
const isKnowledgeBase = (obj: any): obj is KnowledgeBase => {
  return obj && typeof obj.name === 'string' && typeof obj.type === 'string';
};

export async function getKnowledgeBases() {
  try {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*, documents(count)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Transform the data to include document count
    return data.map(kb => ({
      ...kb,
      documentCount: kb.documents?.[0]?.count || 0,
      lastUpdated: kb.updated_at
    })) as KnowledgeBase[];
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    throw error;
  }
}

export async function createKnowledgeBase(name: string, type: KnowledgeBaseType, description: string | null, config: Record<string, any>) {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert([
        { 
          name, 
          type, 
          description, 
          config,
          user_id: user.id 
        }
      ])
      .select();
      
    if (error) throw error;
    return data[0] as KnowledgeBase;
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    throw error;
  }
}

export async function updateKnowledgeBase(id: string, updates: Partial<KnowledgeBase>) {
  try {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data[0] as KnowledgeBase;
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    throw error;
  }
}

export async function deleteKnowledgeBase(id: string) {
  try {
    const { error } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    throw error;
  }
}

export async function getKnowledgeBaseById(id: string) {
  try {
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*, documents(count)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return {
      ...data,
      documentCount: data.documents?.[0]?.count || 0,
      lastUpdated: data.updated_at
    } as KnowledgeBase;
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    throw error;
  }
}

export async function uploadDocument(knowledgeBaseId: string, file: File) {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Create a unique path for the file
    const filePath = `${knowledgeBaseId}/${uuidv4()}-${file.name}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Create document record in database
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert([
        {
          knowledge_base_id: knowledgeBaseId,
          filename: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: 'pending',
          metadata: { originalName: file.name },
          user_id: user.id
        }
      ])
      .select();
      
    if (documentError) throw documentError;
    
    // Call the process-document function
    const { data: processData, error: processError } = await supabase.functions
      .invoke('process-document', {
        body: { documentId: documentData[0].id }
      });
      
    if (processError) {
      console.error('Error processing document:', processError);
      // Don't throw here, as the document was uploaded successfully
    }
    
    return documentData[0] as DocumentFile;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function getDocumentsByKnowledgeBaseId(knowledgeBaseId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as DocumentFile[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

export async function saveApiKey(service: string, name: string, apiKey: string) {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ivString = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // In a real application, we would encrypt the API key here
    // For simplicity, we're just storing it as is (not secure for production)
    // This should be replaced with proper encryption in a real application
    const encryptedKey = apiKey;
    
    const { data, error } = await supabase
      .from('api_keys')
      .insert([
        {
          service,
          name,
          encrypted_key: encryptedKey,
          iv: ivString,
          is_active: true,
          user_id: user.id
        }
      ])
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
}

export async function getApiKeysByService(service: string) {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('service', service)
      .eq('is_active', true);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }
}

export async function vectorSearch(knowledgeBaseId: string, query: string, limit: number = 10, similarityThreshold: number = 0.8, filters: Record<string, any> = {}) {
  try {
    const { data, error } = await supabase.functions
      .invoke('vector-search', {
        body: { 
          knowledge_base_id: knowledgeBaseId,
          query,
          limit,
          similarity_threshold: similarityThreshold,
          filters
        }
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error performing vector search:', error);
    throw error;
  }
}

// Pinecone-specific functions
export async function listPineconeIndexes(): Promise<PineconeIndex[]> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { operation: 'list-indexes' }
      });
      
    if (error) throw error;
    
    // Ensure we return an array even if the API returns unexpected data
    if (!data || !Array.isArray(data)) {
      console.error("Unexpected response format from pinecone-operations:", data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error listing Pinecone indexes:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}

export async function createPineconeIndex(name: string, dimension: number = 1536, serverless: boolean = true, options: any = {}): Promise<PineconeIndex> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { 
          operation: 'create-index',
          name,
          dimension,
          serverless,
          ...options
        }
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating Pinecone index:', error);
    throw error;
  }
}

export async function describePineconeIndex(indexName: string): Promise<PineconeIndex> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { 
          operation: 'describe-index',
          indexName
        }
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error describing Pinecone index:', error);
    throw error;
  }
}

export async function deletePineconeIndex(indexName: string): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { 
          operation: 'delete-index',
          indexName
        }
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting Pinecone index:', error);
    throw error;
  }
}

export async function listPineconeNamespaces(indexName: string): Promise<{ namespaces: string[], stats: any }> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { 
          operation: 'list-namespaces',
          indexName
        }
      });
      
    if (error) throw error;
    
    // Make sure we have a properly formatted response
    if (!data || !Array.isArray(data.namespaces)) {
      console.error("Unexpected namespace response format:", data);
      return { namespaces: [], stats: {} };
    }
    
    return data;
  } catch (error) {
    console.error('Error listing Pinecone namespaces:', error);
    // Return safe defaults on error
    return { namespaces: [], stats: {} };
  }
}

export async function getPineconeStats(indexName: string, namespace?: string): Promise<PineconeStat> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { 
          operation: 'get-stats',
          indexName,
          namespace
        }
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting Pinecone stats:', error);
    throw error;
  }
}

export async function transferToPinecone(knowledgeBaseId: string, indexName: string, namespace: string): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.functions
      .invoke('pinecone-operations', {
        body: { 
          operation: 'transfer-to-pinecone',
          knowledge_base_id: knowledgeBaseId,
          indexName,
          namespace
        }
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error transferring to Pinecone:', error);
    throw error;
  }
}
