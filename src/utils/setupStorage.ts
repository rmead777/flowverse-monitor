
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export async function ensureStorageIsSetup() {
  try {
    console.log('Checking if storage is set up...');
    
    try {
      // First check if the storage bucket function exists and call it
      const { data: functionData, error: functionError } = await supabase.functions.invoke('setup-storage');
      
      if (functionError) {
        console.error('Error invoking setup-storage function:', functionError);
        
        // Provide more detailed error information
        if (typeof functionError === 'object' && functionError !== null) {
          console.error('Error details:', JSON.stringify(functionError, null, 2));
        }
        
        // Don't throw here, we'll fall back to direct bucket check
        console.log('Falling back to direct bucket check...');
      } else if (functionData && functionData.success) {
        console.log('Storage setup response:', functionData);
        return true;
      }
    } catch (functionCallError) {
      console.error('Exception calling setup-storage function:', functionCallError);
      console.log('Falling back to direct bucket check...');
    }
    
    // Fallback - check for the documents bucket directly
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      
      // Check if this is an RLS policy error
      if (bucketsError.message && bucketsError.message.includes('Policy')) {
        console.log('RLS policy error detected. Attempting to call create_documents_bucket function...');
        
        // Use a POST request to call the function instead of rpc() to avoid TypeScript errors
        const { data: rpcData, error: rpcError } = await supabase.functions.invoke('create-documents-bucket');
        
        if (rpcError) {
          console.error('Error creating bucket via edge function:', rpcError);
          throw new Error(`RLS policy restriction: ${bucketsError.message}. Edge function attempt also failed: ${rpcError.message}`);
        }
        
        console.log('Bucket created via edge function:', rpcData);
        return true;
      }
      
      throw bucketsError;
    }
    
    const documentsExists = buckets.some(bucket => bucket.name === 'documents');
    console.log('Documents bucket exists:', documentsExists);
    
    if (!documentsExists) {
      console.log('Attempting to create documents bucket directly...');
      const { error: createError } = await supabase.storage.createBucket('documents', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      });
      
      if (createError) {
        console.error('Error creating documents bucket:', createError);
        
        // Check if this is an RLS policy error
        if (createError.message && createError.message.includes('Policy')) {
          console.log('RLS policy error detected. Attempting to call create_documents_bucket function...');
          
          // Use a POST request to call the function instead of rpc() to avoid TypeScript errors
          const { data: rpcData, error: rpcError } = await supabase.functions.invoke('create-documents-bucket');
          
          if (rpcError) {
            console.error('Error creating bucket via edge function:', rpcError);
            throw new Error(`RLS policy restriction: ${createError.message}. Edge function attempt also failed: ${rpcError.message}`);
          }
          
          console.log('Bucket created via edge function:', rpcData);
          return true;
        }
        
        throw createError;
      }
      
      console.log('Documents bucket created successfully');
    }
    
    return true;
  } catch (error: any) {
    console.error('Error setting up storage:', error);
    toast({
      title: 'Storage Setup Error',
      description: 'There was an error setting up the document storage. Please check your permissions or contact an administrator.',
      variant: 'destructive'
    });
    return false;
  }
}

export async function reprocessPendingDocuments(knowledgeBaseId?: string) {
  try {
    console.log('Reprocessing pending documents for knowledge base:', knowledgeBaseId);
    
    // Directly invoke the reprocess-documents function
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
        description: `${data.processed} documents are being processed. This may take a few minutes.`
      });
    } else if (data && data.processed === 0) {
      toast({
        title: 'No Documents to Process',
        description: 'No pending documents were found.'
      });
    } else {
      console.log('No documents to process or processing failed:', data);
      toast({
        title: 'Processing Notification',
        description: data?.message || 'No documents were processed.'
      });
    }
    
    return data;
  } catch (error: any) {
    console.error('Error reprocessing documents:', error);
    toast({
      title: 'Processing Error',
      description: 'There was an error reprocessing the documents. Please try again.',
      variant: 'destructive'
    });
    return null;
  }
}
