
export type KnowledgeBaseType = 'pinecone' | 'weaviate' | 'supabase' | 'google';
export type KnowledgeBaseStatus = 'active' | 'inactive' | 'indexing' | 'error';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  type: KnowledgeBaseType;
  status: KnowledgeBaseStatus;
  config: KnowledgeBaseConfig;
  documentCount?: number;
  lastUpdated: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseConfig {
  [key: string]: any;
  embedding_model?: string;
  // Pinecone specific
  pineconeEnvironment?: string;
  pineconeIndex?: string;
  pineconeNamespace?: string;
  // Weaviate specific
  weaviateUrl?: string;
  weaviateClassName?: string;
  // Supabase specific
  supabaseUrl?: string;
  // Google specific
  searchEngineId?: string;
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

export interface PineconeIndex {
  name: string;
  dimension: number;
  metric: string;
  status: string;
  host?: string;
  spec?: {
    serverless?: {
      cloud?: string;
      region?: string;
    };
    pod?: {
      environment?: string;
      replicas?: number;
      shards?: number;
      pods?: number;
    };
  };
}

export interface PineconeStat {
  namespaces: Record<string, { vectorCount: number }>;
  dimension: number;
  indexFullness: number;
  totalVectorCount: number;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  document_id: string;
  metadata: Record<string, any>;
  document?: {
    id: string;
    filename: string;
    file_type: string;
    metadata: Record<string, any>;
  };
  similarity: number;
}
