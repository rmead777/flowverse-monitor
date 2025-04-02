
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export async function ensureStorageIsSetup() {
  try {
    console.log('Checking if storage is set up...');
    // Check if the documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw bucketsError;
    }
    
    const documentsExists = buckets.some(bucket => bucket.name === 'documents');
    console.log('Documents bucket exists:', documentsExists);
    
    if (!documentsExists) {
      console.log('Creating documents bucket...');
      // Call the setup-storage function to create the bucket
      const { error } = await supabase.functions.invoke('setup-storage');
      
      if (error) {
        console.error('Error invoking setup-storage function:', error);
        throw error;
      }
      
      console.log('Documents storage bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up storage:', error);
    toast({
      title: 'Storage Setup Error',
      description: 'There was an error setting up the document storage',
      variant: 'destructive'
    });
    return false;
  }
}

export async function reprocessPendingDocuments(knowledgeBaseId?: string) {
  try {
    console.log('Reprocessing pending documents for knowledge base:', knowledgeBaseId);
    
    // Removing the call to listFunctions() since it doesn't exist
    // Instead, we'll just invoke the function directly
    
    const { data, error } = await supabase.functions.invoke('reprocess-documents', {
      body: { knowledgeBaseId }
    });
    
    if (error) {
      console.error('Error from reprocess-documents function:', error);
      throw error;
    }
    
    console.log('Reprocess response:', data);
    
    if (data && data.processed > 0) {
      toast({
        title: 'Document Processing Started',
        description: `${data.processed} documents are being processed`
      });
    } else {
      console.log('No documents to process or processing failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error reprocessing documents:', error);
    toast({
      title: 'Processing Error',
      description: 'There was an error reprocessing the documents',
      variant: 'destructive'
    });
    return null;
  }
}
