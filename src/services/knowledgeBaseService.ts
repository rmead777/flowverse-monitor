
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeBase, KnowledgeBaseType, DocumentFile } from "@/types/knowledgeBase";
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
