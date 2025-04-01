
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export async function ensureStorageIsSetup() {
  try {
    // Check if the documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) throw bucketsError;
    
    const documentsExists = buckets.some(bucket => bucket.name === 'documents');
    
    if (!documentsExists) {
      // Call the setup-storage function to create the bucket
      const { error } = await supabase.functions.invoke('setup-storage');
      
      if (error) throw error;
      
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
    const { data, error } = await supabase.functions.invoke('reprocess-documents', {
      body: { knowledgeBaseId }
    });
    
    if (error) throw error;
    
    if (data.processed > 0) {
      toast({
        title: 'Document Processing Started',
        description: `${data.processed} documents are being processed`
      });
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
