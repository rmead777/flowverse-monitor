
import { useState } from 'react';
import { Button } from './ui/button';
import { Document } from '@/types/knowledgeBase';
import { FileText, DownloadCloud, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onUploadClick: () => void;
}

const DocumentList = ({ documents, isLoading, onUploadClick }: DocumentListProps) => {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (document: Document) => {
    try {
      setDownloadingId(document.id);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);
        
      if (error) throw error;
      
      // Create a download link and trigger the download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${document.filename}`
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download Error',
        description: 'There was an error downloading the document',
        variant: 'destructive'
      });
    } finally {
      setDownloadingId(null);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button 
          onClick={onUploadClick}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-500" />
          <p className="mt-2 text-gray-400">No documents have been uploaded yet</p>
          <Button 
            onClick={onUploadClick}
            variant="outline" 
            className="mt-4 border-gray-700 text-gray-300"
          >
            Upload Documents
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <div className="font-medium text-white">{doc.filename}</div>
                  <div className="text-xs text-gray-400">
                    {(doc.file_size / 1024).toFixed(2)} KB • {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-700">
                  {getStatusIcon(doc.status)}
                  <span className="capitalize">{doc.status}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DownloadCloud className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
