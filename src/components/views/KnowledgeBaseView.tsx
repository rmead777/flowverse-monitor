import { useState, useEffect, useRef, useCallback } from 'react';
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
import { KnowledgeBase, KnowledgeBaseType, DocumentFile } from '@/types/knowledgeBase';
import PineconeConfig from '@/components/PineconeConfig';

const KnowledgeBaseView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddKbDialog, setShowAddKbDialog] = useState(false);
  const [showKbDetailsDialog, setShowKbDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newKbData, setNewKbData] = useState({
    name: '',
    type: 'pinecone' as KnowledgeBaseType,
    description: '',
    apiKey: '',
    environment: '',
    namespace: '',
    embeddingModel: 'text-embedding-ada-002'
  });
  
  const [apiKeyData, setApiKeyData] = useState({
    name: '',
    apiKey: '',
    service: ''
  });

  const { 
    knowledgeBases, 
    isLoadingKnowledgeBases,
    refetchKnowledgeBases,
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
  
  const { data: selectedKbDocuments, isLoading: isLoadingDocuments, refetch: refetchDocuments } = 
    useKnowledgeBase().getDocuments(selectedKnowledgeBase?.id || '');

  const resetState = useCallback(() => {
    setSelectedKnowledgeBase(null);
    setShowDeleteDialog(false);
    setShowKbDetailsDialog(false);
    setIsDeleting(false);
    setTimeout(() => {
      refetchKnowledgeBases();
    }, 500);
  }, [refetchKnowledgeBases]);

  const handleAddKnowledgeBase = () => {
    const config: Record<string, any> = {};
    
    if (newKbData.apiKey) {
      config.apiKey = newKbData.apiKey;
    }
    
    if (newKbData.embeddingModel) {
      config.embedding_model = newKbData.embeddingModel;
    } else {
      config.embedding_model = 'text-embedding-ada-002';
    }
    
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
      namespace: '',
      embeddingModel: 'text-embedding-ada-002'
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
  
  const handleDeleteKnowledgeBase = async () => {
    if (selectedKnowledgeBase) {
      try {
        setIsDeleting(true);
        await deleteKnowledgeBase(selectedKnowledgeBase.id);
        resetState();
        toast({
          title: 'Knowledge Base Deleted',
          description: 'Knowledge Base has been successfully deleted'
        });
      } catch (error) {
        console.error('Error deleting knowledge base:', error);
        setIsDeleting(false);
        toast({
          title: 'Deletion Error',
          description: 'There was an error deleting the knowledge base',
          variant: 'destructive'
        });
      }
    }
  };
  
  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedKnowledgeBase) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
              <Label htmlFor="environment">Pinecone Environment</Label>
              <Input 
                id="environment" 
                value={newKbData.environment}
                onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="us-west1-gcp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace">Namespace (optional)</Label>
              <Input 
                id="namespace" 
                value={newKbData.namespace}
                onChange={(e) => setNewKbData({...newKbData, namespace: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="my-namespace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="embeddingModel">Embedding Model</Label>
              <Select 
                value={newKbData.embeddingModel || 'text-embedding-ada-002'} 
                onValueChange={(value) => setNewKbData({...newKbData, embeddingModel: value})}
              >
                <SelectTrigger id="embeddingModel" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select embedding model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="text-embedding-ada-002">OpenAI (text-embedding-ada-002)</SelectItem>
                  <SelectItem value="voyage-finance-2">Voyage Finance 2</SelectItem>
                  <SelectItem value="voyage-3-large">Voyage 3 Large</SelectItem>
                </SelectContent>
              </Select>
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

  useEffect(() => {
    return () => {
      setShowAddKbDialog(false);
      setShowKbDetailsDialog(false);
      setShowDeleteDialog(false);
      setApiKeyDialog(false);
      setUploadDialogOpen(false);
      setSelectedKnowledgeBase(null);
    };
  }, []);

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

      {selectedKnowledgeBase && (
        <Dialog 
          open={showKbDetailsDialog} 
          onOpenChange={(open) => {
            if (!isDeleting || !open) {
              setShowKbDetailsDialog(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-[750px] bg-gray-900 border-gray-800 text-white">
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
            
            <div className="border-b border-gray-800 mt-2 mb-4">
              <div className="flex space-x-4">
                <button
                  className={`pb-2 pt-1 px-1 border-b-2 ${
                    activeTab === 'general' 
                      ? 'border-indigo-500 text-indigo-400 font-medium' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('general')}
                >
                  General
                </button>
                {selectedKnowledgeBase.type === 'pinecone' && (
                  <button
                    className={`pb-2 pt-1 px-1 border-b-2 ${
                      activeTab === 'pinecone' 
                        ? 'border-indigo-500 text-indigo-400 font-medium' 
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('pinecone')}
                  >
                    Pinecone Config
                  </button>
                )}
                <button
                  className={`pb-2 pt-1 px-1 border-b-2 ${
                    activeTab === 'documents' 
                      ? 'border-indigo-500 text-indigo-400 font-medium' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('documents')}
                >
                  Documents
                </button>
              </div>
            </div>
            
            {activeTab === 'general' && (
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
                
                <div className="bg-gray-800 p-3 rounded-md mb-4">
                  <span className="text-gray-400 text-xs">Configuration</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Embedding Model</span>
                      <span className="text-white">
                        {selectedKnowledgeBase.config.embedding_model || 'text-embedding-ada-002'}
                      </span>
                    </div>
                    
                    {selectedKnowledgeBase.type === 'pinecone' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pinecone Index</span>
                          <span className="text-white">
                            {selectedKnowledgeBase.config.pineconeIndex || 'Not configured'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Namespace</span>
                          <span className="text-white">
                            {selectedKnowledgeBase.config.pineconeNamespace || 'default'}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {selectedKnowledgeBase.type === 'weaviate' && selectedKnowledgeBase.config.url && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">URL</span>
                        <span className="text-white">{selectedKnowledgeBase.config.url}</span>
                      </div>
                    )}
                    
                    {selectedKnowledgeBase.type === 'supabase' && selectedKnowledgeBase.config.url && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">URL</span>
                        <span className="text-white">{selectedKnowledgeBase.config.url}</span>
                      </div>
                    )}
                    
                    {selectedKnowledgeBase.type === 'google' && selectedKnowledgeBase.config.searchEngineId && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Search Engine ID</span>
                        <span className="text-white">{selectedKnowledgeBase.config.searchEngineId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'pinecone' && selectedKnowledgeBase.type === 'pinecone' && (
              <div className="py-4">
                <PineconeConfig 
                  knowledgeBase={selectedKnowledgeBase}
                  onUpdateConfig={(config) => {
                    updateKnowledgeBase({
                      id: selectedKnowledgeBase.id,
                      updates: { config }
                    });
                  }}
                />
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div className="py-4">
                <DocumentList 
                  documents={selectedKbDocuments || []}
                  isLoading={isLoadingDocuments}
                  onUploadClick={() => setUploadDialogOpen(true)}
                />
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKbDetailsDialog(false)} className="border-gray-700 text-gray-300">
                Close
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
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

      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          if (!isDeleting || !open) {
            setShowDeleteDialog(open);
          }
        }}
      >
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
            <AlertDialogCancel 
              className="border-gray-700 text-gray-300"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteKnowledgeBase}
              disabled={isDeleting || isDeletingKnowledgeBase}
            >
              {isDeleting || isDeletingKnowledgeBase ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> :
                'Delete'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
