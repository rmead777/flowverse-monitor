
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Database, Globe, Search } from 'lucide-react';

const knowledgeBases = [
  {
    id: '1',
    name: 'Technical Documentation',
    type: 'Pinecone',
    status: 'active',
    documentCount: 248,
    lastUpdated: '2023-06-10'
  },
  {
    id: '2',
    name: 'Product Manuals',
    type: 'Weaviate',
    status: 'active',
    documentCount: 112,
    lastUpdated: '2023-07-01'
  },
  {
    id: '3',
    name: 'Customer Support',
    type: 'Supabase',
    status: 'indexing',
    documentCount: 503,
    lastUpdated: '2023-07-12'
  }
];

const KnowledgeBaseView = () => {
  const [showAddKbDialog, setShowAddKbDialog] = useState(false);
  const [showKbDetailsDialog, setShowKbDetailsDialog] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(null);
  const [newKbData, setNewKbData] = useState({
    name: '',
    type: 'pinecone',
    apiKey: '',
    environment: '',
    namespace: ''
  });

  const handleAddKnowledgeBase = () => {
    toast({
      title: 'Knowledge Base Added',
      description: `"${newKbData.name}" has been successfully added.`
    });
    setShowAddKbDialog(false);
    setNewKbData({
      name: '',
      type: 'pinecone',
      apiKey: '',
      environment: '',
      namespace: ''
    });
  };

  const handleViewKnowledgeBase = (kb) => {
    setSelectedKnowledgeBase(kb);
    setShowKbDetailsDialog(true);
  };

  const getIconForType = (type) => {
    switch (type.toLowerCase()) {
      case 'pinecone':
        return <Database className="h-6 w-6 text-blue-400" />;
      case 'weaviate':
        return <Globe className="h-6 w-6 text-indigo-400" />;
      case 'supabase':
        return <Database className="h-6 w-6 text-green-400" />;
      case 'google search api':
        return <Search className="h-6 w-6 text-red-400" />;
      default:
        return <BookOpen className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
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
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setShowAddKbDialog(true)}
        >
          Add Knowledge Base
        </Button>
      </div>

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
              <div>{kb.documentCount} documents</div>
              <div>Updated: {kb.lastUpdated}</div>
            </div>
          </div>
        ))}
      </div>

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
              <Label htmlFor="type">Type</Label>
              <Select 
                value={newKbData.type} 
                onValueChange={(value) => setNewKbData({...newKbData, type: value})}
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
            <Button onClick={handleAddKnowledgeBase} className="bg-indigo-600 hover:bg-indigo-700">
              Add Knowledge Base
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedKnowledgeBase && (
        <Dialog open={showKbDetailsDialog} onOpenChange={setShowKbDetailsDialog}>
          <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{selectedKnowledgeBase.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Type</span>
                  <p className="text-white">{selectedKnowledgeBase.type}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Status</span>
                  <p className="text-white capitalize">{selectedKnowledgeBase.status}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Documents</span>
                  <p className="text-white">{selectedKnowledgeBase.documentCount}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Last Updated</span>
                  <p className="text-white">{selectedKnowledgeBase.lastUpdated}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-semibold mb-2">Documents</h3>
                <div className="border-2 border-dashed border-gray-700 p-6 rounded-md text-center">
                  <p className="text-gray-400">Drag and drop PDFs or text files here</p>
                  <p className="text-gray-500 text-xs mt-1">or</p>
                  <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700">Upload Files</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKbDetailsDialog(false)} className="border-gray-700 text-gray-300">
                Close
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KnowledgeBaseView;
