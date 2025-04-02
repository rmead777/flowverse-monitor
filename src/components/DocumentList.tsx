import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { DocumentFile } from '@/types/knowledgeBase';
import { 
  FileText, 
  DownloadCloud, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { reprocessPendingDocuments } from '@/utils/setupStorage';

interface DocumentListProps {
  documents: DocumentFile[];
  isLoading: boolean;
  onUploadClick: () => void;
  knowledgeBaseId?: string;
  onDocumentDeleted?: () => void;
}

const DocumentList = ({ 
  documents, 
  isLoading, 
  onUploadClick, 
  knowledgeBaseId,
  onDocumentDeleted 
}: DocumentListProps) => {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentFile[]>(documents);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReprocessingAll, setIsReprocessingAll] = useState(false);

  useEffect(() => {
    let filtered = [...documents];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.filename.toLowerCase().includes(query) || 
        (doc.metadata?.originalName && doc.metadata.originalName.toString().toLowerCase().includes(query))
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }
    
    switch(sortOption) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.filename.localeCompare(b.filename));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.filename.localeCompare(a.filename));
        break;
      case 'size_asc':
        filtered.sort((a, b) => a.file_size - b.file_size);
        break;
      case 'size_desc':
        filtered.sort((a, b) => b.file_size - a.file_size);
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedStatus, sortOption]);

  const handleDownload = async (doc: DocumentFile) => {
    try {
      setDownloadingId(doc.id);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);
        
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${doc.filename}`
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

  const handleReprocessDocument = async (doc: DocumentFile) => {
    if (!knowledgeBaseId) return;
    
    try {
      setProcessingId(doc.id);
      
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId: doc.id }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Document Processing Started',
        description: `${doc.filename} is being processed`,
      });
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'pending' })
        .eq('id', doc.id);
        
      if (updateError) throw updateError;
      
      setTimeout(() => {
        if (onDocumentDeleted) {
          onDocumentDeleted();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast({
        title: 'Processing Error',
        description: 'There was an error reprocessing the document',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteDocument = async (doc: DocumentFile) => {
    try {
      setDeletingId(doc.id);
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);
        
      if (storageError) throw storageError;
      
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', doc.id);
        
      if (chunksError) throw chunksError;
      
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);
        
      if (docError) throw docError;
      
      toast({
        title: 'Document Deleted',
        description: `${doc.filename} has been deleted`
      });
      
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Deletion Error',
        description: 'There was an error deleting the document',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const retryFailedDocuments = async () => {
    if (!knowledgeBaseId) return;
    
    try {
      const failedDocs = documents.filter(doc => doc.status === 'failed');
      if (failedDocs.length === 0) {
        toast({
          title: 'No Failed Documents',
          description: 'There are no failed documents to retry'
        });
        return;
      }
      
      setIsReprocessingAll(true);
      
      const result = await reprocessPendingDocuments(knowledgeBaseId);
      
      if (result && result.processed > 0) {
        toast({
          title: 'Retrying Failed Documents',
          description: `${result.processed} documents are being reprocessed`,
        });
        
        setTimeout(() => {
          if (onDocumentDeleted) {
            onDocumentDeleted();
          }
        }, 3000);
      } else {
        toast({
          title: 'No Documents to Process',
          description: 'There are no failed documents to reprocess',
        });
      }
      
    } catch (error) {
      console.error('Error retrying failed documents:', error);
      toast({
        title: 'Processing Error',
        description: 'There was an error retrying the failed documents',
        variant: 'destructive'
      });
    } finally {
      setIsReprocessingAll(false);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const viewDocumentMetadata = (doc: DocumentFile) => {
    setSelectedDocument(doc);
    setShowMetadataDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const pendingCount = documents.filter(doc => doc.status === 'pending').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Documents</h3>
        <div className="flex gap-2">
          {knowledgeBaseId && pendingCount > 0 && (
            <Button 
              onClick={handleReprocessAllDocuments}
              variant="outline"
              className="flex items-center gap-2 border-amber-700 text-amber-500 hover:bg-amber-900/20"
              disabled={isReprocessingAll}
            >
              {isReprocessingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Reprocess {pendingCount} Document{pendingCount !== 1 ? 's' : ''}</span>
            </Button>
          )}
          {knowledgeBaseId && documents.filter(doc => doc.status === 'failed').length > 0 && (
            <Button 
              onClick={retryFailedDocuments}
              variant="outline"
              className="flex items-center gap-2 border-red-700 text-red-500 hover:bg-red-900/20"
              disabled={isReprocessingAll}
            >
              {isReprocessingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Retry {documents.filter(doc => doc.status === 'failed').length} Failed Document{documents.filter(doc => doc.status === 'failed').length !== 1 ? 's' : ''}</span>
            </Button>
          )}
          <Button 
            onClick={onUploadClick}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Upload Document
          </Button>
        </div>
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search documents..."
                className="pl-10 bg-gray-800 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 w-[130px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-gray-800 border-gray-700 flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    <span>Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem 
                    className={sortOption === 'newest' ? 'bg-gray-700' : ''} 
                    onClick={() => setSortOption('newest')}
                  >
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={sortOption === 'oldest' ? 'bg-gray-700' : ''} 
                    onClick={() => setSortOption('oldest')}
                  >
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={sortOption === 'name_asc' ? 'bg-gray-700' : ''} 
                    onClick={() => setSortOption('name_asc')}
                  >
                    Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={sortOption === 'name_desc' ? 'bg-gray-700' : ''} 
                    onClick={() => setSortOption('name_desc')}
                  >
                    Name (Z-A)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={sortOption === 'size_asc' ? 'bg-gray-700' : ''} 
                    onClick={() => setSortOption('size_asc')}
                  >
                    Size (Smallest)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={sortOption === 'size_desc' ? 'bg-gray-700' : ''} 
                    onClick={() => setSortOption('size_desc')}
                  >
                    Size (Largest)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-gray-800">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="border-t border-gray-800">
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="truncate max-w-[200px]" title={doc.filename}>{doc.filename}</span>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        <span className="capitalize">{doc.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewDocumentMetadata(doc)}
                          title="View metadata"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          title="Download"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <DownloadCloud className="h-4 w-4" />
                          )}
                        </Button>
                        {knowledgeBaseId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReprocessDocument(doc)}
                            disabled={processingId === doc.id}
                            title="Reprocess document"
                          >
                            {processingId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDocument(doc)}
                          disabled={deletingId === doc.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          title="Delete"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Document Metadata</DialogTitle>
            <DialogDescription className="text-gray-400">
              Details and metadata for the selected document
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-10 w-10 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium">{selectedDocument.filename}</h3>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(selectedDocument.file_size)} • {new Date(selectedDocument.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-md p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Document Properties</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Status</div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedDocument.status)}
                    <span className="capitalize">{selectedDocument.status}</span>
                  </div>
                  
                  <div className="text-gray-400">File Type</div>
                  <div>{selectedDocument.file_type}</div>
                  
                  <div className="text-gray-400">File Path</div>
                  <div className="truncate max-w-[200px]">{selectedDocument.file_path}</div>
                  
                  <div className="text-gray-400">Last Updated</div>
                  <div>{new Date(selectedDocument.updated_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-md p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Custom Metadata</h4>
                {Object.keys(selectedDocument.metadata || {}).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedDocument.metadata || {}).map(([key, value]) => (
                      <React.Fragment key={key}>
                        <div className="text-gray-400">{key}</div>
                        <div>{String(value)}</div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No custom metadata available</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMetadataDialog(false)}
              className="border-gray-700 text-gray-300"
            >
              Close
            </Button>
            {selectedDocument && knowledgeBaseId && (
              <Button 
                onClick={() => {
                  setShowMetadataDialog(false);
                  handleReprocessDocument(selectedDocument);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Reprocess Document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentList;
