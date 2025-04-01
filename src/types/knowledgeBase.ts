
export type KnowledgeBaseType = 'pinecone' | 'weaviate' | 'supabase' | 'google';
export type KnowledgeBaseStatus = 'active' | 'inactive' | 'indexing' | 'error';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  type: KnowledgeBaseType;
  status: KnowledgeBaseStatus;
  config: Record<string, any>;
  documentCount?: number;
  lastUpdated: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processed' | 'failed';
  metadata: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  chunkMethod: 'fixed' | 'paragraph' | 'sentence';
}

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
}

export interface KnowledgeBaseStats {
  totalDocuments: number;
  processedDocuments: number;
  pendingDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  avgChunksPerDocument: number;
  lastUpdated: string;
}
