
import { useState, useEffect } from 'react';
import { KnowledgeBase, DocumentFile, KnowledgeBaseType, PineconeIndex } from '@/types/knowledgeBase';
import { useToast } from '@/hooks/use-toast';
import { 
  getKnowledgeBases, 
  createKnowledgeBase, 
  getKnowledgeBaseById,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  uploadDocument,
  getDocumentsByKnowledgeBaseId,
  saveApiKey,
  vectorSearch,
  listPineconeIndexes,
  createPineconeIndex,
  deletePineconeIndex,
  describePineconeIndex,
  listPineconeNamespaces,
  getPineconeStats,
  transferToPinecone
} from '@/services/knowledgeBaseService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useKnowledgeBase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all knowledge bases
  const { 
    data: knowledgeBases,
    isLoading: isLoadingKnowledgeBases,
    error: knowledgeBasesError,
    refetch: refetchKnowledgeBases
  } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: getKnowledgeBases
  });
  
  // Get a single knowledge base by ID
  const getKnowledgeBase = (id: string) => {
    return useQuery({
      queryKey: ['knowledgeBase', id],
      queryFn: () => getKnowledgeBaseById(id),
      enabled: !!id
    });
  };
  
  // Get documents for a knowledge base
  const getDocuments = (knowledgeBaseId: string) => {
    return useQuery({
      queryKey: ['documents', knowledgeBaseId],
      queryFn: () => getDocumentsByKnowledgeBaseId(knowledgeBaseId),
      enabled: !!knowledgeBaseId
    });
  };
  
  // Create a new knowledge base
  const createKnowledgeBaseMutation = useMutation({
    mutationFn: ({ name, type, description, config }: { 
      name: string; 
      type: KnowledgeBaseType; 
      description: string | null; 
      config: Record<string, any> 
    }) => createKnowledgeBase(name, type, description, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: 'Knowledge Base Created',
        description: 'Your knowledge base has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Knowledge Base',
        description: error.message || 'An error occurred while creating the knowledge base.',
        variant: 'destructive',
      });
    }
  });
  
  // Update a knowledge base
  const updateKnowledgeBaseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<KnowledgeBase> }) => 
      updateKnowledgeBase(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', data.id] });
      toast({
        title: 'Knowledge Base Updated',
        description: 'Your knowledge base has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Updating Knowledge Base',
        description: error.message || 'An error occurred while updating the knowledge base.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete a knowledge base
  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: (id: string) => deleteKnowledgeBase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: 'Knowledge Base Deleted',
        description: 'Your knowledge base has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Deleting Knowledge Base',
        description: error.message || 'An error occurred while deleting the knowledge base.',
        variant: 'destructive',
      });
    }
  });
  
  // Upload a document
  const uploadDocumentMutation = useMutation({
    mutationFn: ({ knowledgeBaseId, file }: { knowledgeBaseId: string; file: File }) => 
      uploadDocument(knowledgeBaseId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', data.knowledge_base_id] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', data.knowledge_base_id] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded and is being processed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Uploading Document',
        description: error.message || 'An error occurred while uploading the document.',
        variant: 'destructive',
      });
    }
  });
  
  // Save API key
  const saveApiKeyMutation = useMutation({
    mutationFn: ({ service, name, apiKey }: { service: string; name: string; apiKey: string }) => 
      saveApiKey(service, name, apiKey),
    onSuccess: () => {
      toast({
        title: 'API Key Saved',
        description: 'Your API key has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Saving API Key',
        description: error.message || 'An error occurred while saving the API key.',
        variant: 'destructive',
      });
    }
  });
  
  // Vector search
  const vectorSearchMutation = useMutation({
    mutationFn: ({ 
      knowledgeBaseId, 
      query, 
      limit = 10, 
      similarityThreshold = 0.8,
      filters = {}
    }: { 
      knowledgeBaseId: string; 
      query: string; 
      limit?: number; 
      similarityThreshold?: number;
      filters?: Record<string, any>;
    }) => vectorSearch(knowledgeBaseId, query, limit, similarityThreshold, filters),
    onError: (error: any) => {
      toast({
        title: 'Error Performing Search',
        description: error.message || 'An error occurred while performing the search.',
        variant: 'destructive',
      });
    }
  });
  
  // List Pinecone indexes
  const listPineconeIndexesMutation = useMutation({
    mutationFn: () => listPineconeIndexes(),
    onError: (error: any) => {
      toast({
        title: 'Error Listing Pinecone Indexes',
        description: error.message || 'An error occurred while listing Pinecone indexes.',
        variant: 'destructive',
      });
    }
  });
  
  // Create Pinecone index
  const createPineconeIndexMutation = useMutation({
    mutationFn: ({ 
      name, 
      dimension = 1536, 
      serverless = true, 
      options = {} 
    }: { 
      name: string; 
      dimension?: number; 
      serverless?: boolean; 
      options?: any;
    }) => createPineconeIndex(name, dimension, serverless, options),
    onSuccess: () => {
      toast({
        title: 'Pinecone Index Created',
        description: 'Your Pinecone index has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Pinecone Index',
        description: error.message || 'An error occurred while creating the Pinecone index.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete Pinecone index
  const deletePineconeIndexMutation = useMutation({
    mutationFn: (indexName: string) => deletePineconeIndex(indexName),
    onSuccess: () => {
      toast({
        title: 'Pinecone Index Deleted',
        description: 'Your Pinecone index has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Deleting Pinecone Index',
        description: error.message || 'An error occurred while deleting the Pinecone index.',
        variant: 'destructive',
      });
    }
  });
  
  // Describe Pinecone index
  const describePineconeIndexMutation = useMutation({
    mutationFn: (indexName: string) => describePineconeIndex(indexName),
    onError: (error: any) => {
      toast({
        title: 'Error Describing Pinecone Index',
        description: error.message || 'An error occurred while describing the Pinecone index.',
        variant: 'destructive',
      });
    }
  });
  
  // List Pinecone namespaces
  const listPineconeNamespacesMutation = useMutation({
    mutationFn: (indexName: string) => listPineconeNamespaces(indexName),
    onError: (error: any) => {
      toast({
        title: 'Error Listing Pinecone Namespaces',
        description: error.message || 'An error occurred while listing Pinecone namespaces.',
        variant: 'destructive',
      });
    }
  });
  
  // Get Pinecone stats
  const getPineconeStatsMutation = useMutation({
    mutationFn: ({ indexName, namespace }: { indexName: string; namespace?: string }) => 
      getPineconeStats(indexName, namespace),
    onError: (error: any) => {
      toast({
        title: 'Error Getting Pinecone Stats',
        description: error.message || 'An error occurred while getting Pinecone stats.',
        variant: 'destructive',
      });
    }
  });
  
  // Transfer to Pinecone
  const transferToPineconeMutation = useMutation({
    mutationFn: ({ 
      knowledgeBaseId, 
      indexName, 
      namespace 
    }: { 
      knowledgeBaseId: string; 
      indexName: string; 
      namespace: string;
    }) => transferToPinecone(knowledgeBaseId, indexName, namespace),
    onSuccess: () => {
      toast({
        title: 'Transfer Started',
        description: 'Your documents are being transferred to Pinecone. This may take a few minutes.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Transferring to Pinecone',
        description: error.message || 'An error occurred while transferring to Pinecone.',
        variant: 'destructive',
      });
    }
  });
  
  return {
    // Knowledge base operations
    knowledgeBases,
    isLoadingKnowledgeBases,
    knowledgeBasesError,
    refetchKnowledgeBases,
    getKnowledgeBase,
    getDocuments,
    createKnowledgeBase: createKnowledgeBaseMutation.mutate,
    isCreatingKnowledgeBase: createKnowledgeBaseMutation.isPending,
    updateKnowledgeBase: updateKnowledgeBaseMutation.mutate,
    isUpdatingKnowledgeBase: updateKnowledgeBaseMutation.isPending,
    deleteKnowledgeBase: deleteKnowledgeBaseMutation.mutate,
    isDeletingKnowledgeBase: deleteKnowledgeBaseMutation.isPending,
    
    // Document operations
    uploadDocument: uploadDocumentMutation.mutate,
    isUploadingDocument: uploadDocumentMutation.isPending,
    
    // API key operations
    saveApiKey: saveApiKeyMutation.mutate,
    isSavingApiKey: saveApiKeyMutation.isPending,
    
    // Search operations
    vectorSearch: vectorSearchMutation.mutate,
    isSearching: vectorSearchMutation.isPending,
    searchResults: vectorSearchMutation.data,
    
    // Pinecone operations
    listPineconeIndexes: listPineconeIndexesMutation.mutate,
    isListingPineconeIndexes: listPineconeIndexesMutation.isPending,
    createPineconeIndex: createPineconeIndexMutation.mutate,
    isCreatingPineconeIndex: createPineconeIndexMutation.isPending,
    deletePineconeIndex: deletePineconeIndexMutation.mutate,
    isDeletingPineconeIndex: deletePineconeIndexMutation.isPending,
    describePineconeIndex: describePineconeIndexMutation.mutate,
    isDescribingPineconeIndex: describePineconeIndexMutation.isPending,
    listPineconeNamespaces: listPineconeNamespacesMutation.mutate,
    isListingPineconeNamespaces: listPineconeNamespacesMutation.isPending,
    getPineconeStats: getPineconeStatsMutation.mutate,
    isGettingPineconeStats: getPineconeStatsMutation.isPending,
    transferToPinecone: transferToPineconeMutation.mutate,
    isTransferringToPinecone: transferToPineconeMutation.isPending
  };
}
