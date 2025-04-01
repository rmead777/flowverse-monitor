
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Database, Globe, Search, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import DocumentList from '@/components/DocumentList';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { KnowledgeBase, KnowledgeBaseType } from '@/types/knowledgeBase';

const KnowledgeBaseView = () => {
  const { user } = useAuth();
  const [showAddKbDialog, setShowAddKbDialog] = useState(false);
  const [showKbDetailsDialog, setShowKbDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  
  const [newKbData, setNewKbData] = useState({
    name: '',
    type: 'pinecone' as KnowledgeBaseType,
    description: '',
    apiKey: '',
    environment: '',
    namespace: ''
  });
  
  const [apiKeyData, setApiKeyData] = useState({
    name: '',
    apiKey: '',
    service: ''
  });

  const { 
    knowledgeBases, 
    isLoadingKnowledgeBases,
    createKnowledgeBase,
    isCreatingKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    isDeletingKnowledgeBase,
    uploadDocument,
    isUploadingDocument,
    saveApiKey,
    isSavingApiKey
  } = useKnowledgeBase();
  
  const { data: selectedKbDocuments, isLoading: isLoadingDocuments } = 
    useKnowledgeBase().getDocuments(selectedKnowledgeBase?.id || '');

  const { toast } = useToast();

  const handleAddKnowledgeBase = () => {
    const config: Record<string, any> = {};
    
    // Add the API key to the config
    if (newKbData.apiKey) {
      config.apiKey = newKbData.apiKey;
    }
    
    // Add type-specific config
    switch (newKbData.type) {
      case 'pinecone':
        config.environment = newKbData.environment;
        if (newKbData.namespace) config.namespace = newKbData.namespace;
        break;
      case 'weaviate':
      case 'supabase':
        config.url = newKbData.environment;
        break;
      case 'google':
        config.searchEngineId = newKbData.environment;
        break;
    }
    
    createKnowledgeBase({
      name: newKbData.name,
      type: newKbData.type,
      description: newKbData.description || null,
      config
    });
    
    // If API key was provided, also save it separately
    if (newKbData.apiKey) {
      saveApiKey({
        service: newKbData.type,
        name: `${newKbData.type} - ${newKbData.name}`,
        apiKey: newKbData.apiKey
      });
    }
    
    setNewKbData({
      name: '',
      type: 'pinecone',
      description: '',
      apiKey: '',
      environment: '',
      namespace: ''
    });
    
    setShowAddKbDialog(false);
  };

  const handleViewKnowledgeBase = (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb);
    setShowKbDetailsDialog(true);
  };
  
  const handleSaveApiKey = () => {
    saveApiKey({
      service: apiKeyData.service,
      name: apiKeyData.name,
      apiKey: apiKeyData.apiKey
    });
    
    setApiKeyData({
      name: '',
      apiKey: '',
      service: ''
    });
    
    setApiKeyDialog(false);
  };
  
  const handleDeleteKnowledgeBase = () => {
    if (selectedKnowledgeBase) {
      deleteKnowledgeBase(selectedKnowledgeBase.id);
      setShowDeleteDialog(false);
      setShowKbDetailsDialog(false);
    }
  };
  
  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedKnowledgeBase) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Check if the file is a PDF or text file
      if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        uploadDocument({
          knowledgeBaseId: selectedKnowledgeBase.id,
          file
        });
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Only PDF and text files are supported.',
          variant: 'destructive'
        });
      }
    }
    
    setUploadDialogOpen(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pinecone':
        return <Database className="h-6 w-6 text-blue-400" />;
      case 'weaviate':
        return <Globe className="h-6 w-6 text-indigo-400" />;
      case 'supabase':
        return <Database className="h-6 w-6 text-green-400" />;
      case 'google':
        return <Search className="h-6 w-6 text-red-400" />;
      default:
        return <BookOpen className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'indexing':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDynamicKbFields = () => {
    switch (newKbData.type) {
      case 'pinecone':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input 
                id="environment" 
                value={newKbData.environment}
                onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace">Namespace (optional)</Label>
              <Input 
                id="namespace" 
                value={newKbData.namespace}
                onChange={(e) => setNewKbData({...newKbData, namespace: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </>
        );
      case 'weaviate':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">Weaviate URL</Label>
            <Input 
              id="url" 
              value={newKbData.environment}
              onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="https://instance.weaviate.network"
            />
          </div>
        );
      case 'supabase':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">Project URL</Label>
            <Input 
              id="url" 
              value={newKbData.environment}
              onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="https://project.supabase.co"
            />
          </div>
        );
      case 'google':
        return (
          <div className="space-y-2">
            <Label htmlFor="customSearch">Search Engine ID</Label>
            <Input 
              id="customSearch" 
              value={newKbData.environment}
              onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Bases</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-gray-700 text-gray-300"
            onClick={() => {
              setApiKeyData({
                name: '',
                apiKey: '',
                service: 'pinecone'
              });
              setApiKeyDialog(true);
            }}
          >
            Add API Key
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setShowAddKbDialog(true)}
          >
            Add Knowledge Base
          </Button>
        </div>
      </div>

      {isLoadingKnowledgeBases ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      ) : knowledgeBases && knowledgeBases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBases.map((kb) => (
            <div 
              key={kb.id} 
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors"
              onClick={() => handleViewKnowledgeBase(kb)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getIconForType(kb.type)}
                  <div>
                    <h3 className="font-semibold text-lg">{kb.name}</h3>
                    <p className="text-gray-400 text-sm">{kb.type}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(kb.status)} mr-2`}></span>
                  <span className="text-sm capitalize">{kb.status}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm text-gray-400">
                <div>{kb.documentCount || 0} documents</div>
                <div>Updated: {new Date(kb.lastUpdated).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-lg">
          <BookOpen className="mx-auto h-16 w-16 text-gray-500" />
          <h3 className="mt-4 text-xl font-medium text-gray-300">No Knowledge Bases Found</h3>
          <p className="mt-2 text-gray-400">Add your first knowledge base to get started</p>
          <Button 
            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setShowAddKbDialog(true)}
          >
            Add Knowledge Base
          </Button>
        </div>
      )}

      {/* Add Knowledge Base Dialog */}
      <Dialog open={showAddKbDialog} onOpenChange={setShowAddKbDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={newKbData.name}
                onChange={(e) => setNewKbData({...newKbData, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={newKbData.description}
                onChange={(e) => setNewKbData({...newKbData, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={newKbData.type} 
                onValueChange={(value: KnowledgeBaseType) => setNewKbData({...newKbData, type: value})}
              >
                <SelectTrigger id="type" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="pinecone">Pinecone</SelectItem>
                  <SelectItem value="weaviate">Weaviate</SelectItem>
                  <SelectItem value="supabase">Supabase</SelectItem>
                  <SelectItem value="google">Google Search API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input 
                id="apiKey" 
                type="password"
                value={newKbData.apiKey}
                onChange={(e) => setNewKbData({...newKbData, apiKey: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            {getDynamicKbFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKbDialog(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAddKnowledgeBase} 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isCreatingKnowledgeBase || !newKbData.name}
            >
              {isCreatingKnowledgeBase ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> :
                'Add Knowledge Base'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Knowledge Base Details Dialog */}
      {selectedKnowledgeBase && (
        <Dialog open={showKbDetailsDialog} onOpenChange={setShowKbDetailsDialog}>
          <DialogContent className="sm:max-w-[650px] bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="flex items-center gap-2">
                  {getIconForType(selectedKnowledgeBase.type)}
                  {selectedKnowledgeBase.name}
                </DialogTitle>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="text-white"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Type</span>
                  <p className="text-white capitalize">{selectedKnowledgeBase.type}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Status</span>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(selectedKnowledgeBase.status)} mr-2`}></span>
                    <p className="text-white capitalize">{selectedKnowledgeBase.status}</p>
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Documents</span>
                  <p className="text-white">{selectedKnowledgeBase.documentCount || 0}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Last Updated</span>
                  <p className="text-white">{new Date(selectedKnowledgeBase.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedKnowledgeBase.description && (
                <div className="bg-gray-800 p-3 rounded-md mb-4">
                  <span className="text-gray-400 text-xs">Description</span>
                  <p className="text-white">{selectedKnowledgeBase.description}</p>
                </div>
              )}
              
              <div className="border-t border-gray-800 pt-4">
                <DocumentList 
                  documents={selectedKbDocuments || []}
                  isLoading={isLoadingDocuments}
                  onUploadClick={() => setUploadDialogOpen(true)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKbDetailsDialog(false)} className="border-gray-700 text-gray-300">
                Close
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  // Toggle the knowledge base status
                  const newStatus = selectedKnowledgeBase.status === 'active' ? 'inactive' : 'active';
                  updateKnowledgeBase({
                    id: selectedKnowledgeBase.id,
                    updates: { status: newStatus }
                  });
                }}
              >
                {selectedKnowledgeBase.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Knowledge Base
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this knowledge base? This action cannot be undone and all associated documents will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteKnowledgeBase}
              disabled={isDeletingKnowledgeBase}
            >
              {isDeletingKnowledgeBase ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> :
                'Delete'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog} onOpenChange={setApiKeyDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input 
                id="keyName" 
                value={apiKeyData.name}
                onChange={(e) => setApiKeyData({...apiKeyData, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. Pinecone Production"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select 
                value={apiKeyData.service} 
                onValueChange={(value) => setApiKeyData({...apiKeyData, service: value})}
              >
                <SelectTrigger id="service" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="pinecone">Pinecone</SelectItem>
                  <SelectItem value="weaviate">Weaviate</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="google">Google API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyValue">API Key</Label>
              <Input 
                id="apiKeyValue" 
                type="password"
                value={apiKeyData.apiKey}
                onChange={(e) => setApiKeyData({...apiKeyData, apiKey: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialog(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveApiKey} 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isSavingApiKey || !apiKeyData.name || !apiKeyData.apiKey || !apiKeyData.service}
            >
              {isSavingApiKey ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> :
                'Save API Key'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <div 
            className={`border-2 border-dashed ${dragOver ? 'border-indigo-500 bg-indigo-950/20' : 'border-gray-700'} p-8 rounded-md text-center`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.txt,.md,.csv"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <BookOpen className="mx-auto h-12 w-12 text-gray-500" />
            <p className="text-gray-400 mt-2">Drag and drop PDF or text files here</p>
            <p className="text-gray-500 text-xs mt-1">or</p>
            <Button 
              className="mt-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingDocument}
            >
              {isUploadingDocument ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> :
                'Select Files'
              }
            </Button>
            <p className="text-gray-500 text-xs mt-4">Supported file types: PDF, TXT, MD, CSV</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBaseView;
