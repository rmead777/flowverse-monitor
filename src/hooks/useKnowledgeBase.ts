
import { useState, useEffect } from 'react';
import { KnowledgeBase, DocumentFile, KnowledgeBaseType } from '@/types/knowledgeBase';
import { useToast } from '@/hooks/use-toast';
import { 
  getKnowledgeBases, 
  createKnowledgeBase, 
  getKnowledgeBaseById,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  uploadDocument,
  getDocumentsByKnowledgeBaseId,
  saveApiKey
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
        description: 'Your document has been uploaded successfully.',
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
  
  return {
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
    uploadDocument: uploadDocumentMutation.mutate,
    isUploadingDocument: uploadDocumentMutation.isPending,
    saveApiKey: saveApiKeyMutation.mutate,
    isSavingApiKey: saveApiKeyMutation.isPending
  };
}
