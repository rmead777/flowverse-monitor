import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash } from 'lucide-react';
import { KnowledgeBase, PineconeIndex } from '@/types/knowledgeBase';
import { 
  listPineconeIndexes, 
  createPineconeIndex, 
  deletePineconeIndex,
  transferToPinecone,
  listPineconeNamespaces
} from '@/services/knowledgeBaseService';

interface PineconeConfigProps {
  knowledgeBase: KnowledgeBase | null;
  onUpdateConfig: (config: Record<string, any>) => void;
}

const PineconeConfig: React.FC<PineconeConfigProps> = ({ knowledgeBase, onUpdateConfig }) => {
  const { toast } = useToast();
  
  const [indexes, setIndexes] = useState<PineconeIndex[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexLoading, setIndexLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [namespaceInput, setNamespaceInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const [newIndexData, setNewIndexData] = useState({
    name: '',
    dimension: 1536,
    serverless: true,
    region: 'us-west-2'
  });

  useEffect(() => {
    loadIndexes();
  }, []);

  useEffect(() => {
    if (knowledgeBase && knowledgeBase.config) {
      if (knowledgeBase.config.pineconeIndex) {
        setSelectedIndex(knowledgeBase.config.pineconeIndex);
        loadNamespaces(knowledgeBase.config.pineconeIndex);
      }
      if (knowledgeBase.config.pineconeNamespace) {
        setSelectedNamespace(knowledgeBase.config.pineconeNamespace);
      }
    }
  }, [knowledgeBase]);

  const loadIndexes = async () => {
    try {
      setLoading(true);
      const data = await listPineconeIndexes();
      
      if (Array.isArray(data)) {
        setIndexes(data);
      } else {
        console.error("Received non-array data from listPineconeIndexes:", data);
        setIndexes([]);
        toast({
          title: 'Error loading Pinecone indexes',
          description: 'Received invalid data format from Pinecone API',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error("Error in loadIndexes:", error);
      setIndexes([]);
      toast({
        title: 'Error loading Pinecone indexes',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async (indexName: string) => {
    if (!indexName) return;
    
    try {
      setIndexLoading(true);
      const response = await listPineconeNamespaces(indexName);
      
      if (response && Array.isArray(response.namespaces)) {
        setNamespaces(response.namespaces);
      } else {
        console.error("Invalid namespace response:", response);
        setNamespaces([]);
        toast({
          title: 'Error loading namespaces',
          description: 'Received invalid data format',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error("Error in loadNamespaces:", error);
      setNamespaces([]);
      toast({
        title: 'Error loading namespaces',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIndexLoading(false);
    }
  };

  const handleCreateIndex = async () => {
    try {
      setLoading(true);
      
      if (!newIndexData.name || newIndexData.name.trim() === '') {
        toast({
          title: 'Invalid index name',
          description: 'Please provide a valid index name',
          variant: 'destructive'
        });
        return;
      }
      
      await createPineconeIndex(
        newIndexData.name, 
        newIndexData.dimension, 
        newIndexData.serverless, 
        { region: newIndexData.region }
      );
      
      toast({
        title: 'Index created',
        description: `Index "${newIndexData.name}" has been created successfully`,
      });
      
      await loadIndexes();
      
      setSelectedIndex(newIndexData.name);
      loadNamespaces(newIndexData.name);
      
      onUpdateConfig({
        ...knowledgeBase?.config,
        pineconeIndex: newIndexData.name,
        pineconeNamespace: selectedNamespace || ''
      });
      
      setNewIndexData({
        name: '',
        dimension: 1536,
        serverless: true,
        region: 'us-west-2'
      });
      setShowCreateDialog(false);
      
    } catch (error) {
      toast({
        title: 'Error creating index',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndex = async (indexName: string) => {
    if (!confirm(`Are you sure you want to delete index "${indexName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await deletePineconeIndex(indexName);
      
      toast({
        title: 'Index deleted',
        description: `Index "${indexName}" has been deleted successfully`,
      });
      
      await loadIndexes();
      
      if (selectedIndex === indexName) {
        setSelectedIndex('');
        setSelectedNamespace('');
        onUpdateConfig({
          ...knowledgeBase?.config,
          pineconeIndex: '',
          pineconeNamespace: ''
        });
      }
      
    } catch (error) {
      toast({
        title: 'Error deleting index',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIndexSelect = (indexName: string) => {
    setSelectedIndex(indexName);
    loadNamespaces(indexName);
    
    onUpdateConfig({
      ...knowledgeBase?.config,
      pineconeIndex: indexName,
      pineconeNamespace: selectedNamespace
    });
  };

  const handleNamespaceSelect = (namespace: string) => {
    setSelectedNamespace(namespace);
    
    onUpdateConfig({
      ...knowledgeBase?.config,
      pineconeIndex: selectedIndex,
      pineconeNamespace: namespace
    });
  };

  const handleAddNamespace = () => {
    if (!namespaceInput.trim()) return;
    
    if (!namespaces.includes(namespaceInput)) {
      setNamespaces([...namespaces, namespaceInput]);
    }
    
    setSelectedNamespace(namespaceInput);
    
    onUpdateConfig({
      ...knowledgeBase?.config,
      pineconeIndex: selectedIndex,
      pineconeNamespace: namespaceInput
    });
    
    setNamespaceInput('');
  };

  const handleTransferToPinecone = async () => {
    if (!knowledgeBase || !selectedIndex) return;
    
    try {
      setTransferLoading(true);
      
      const namespace = selectedNamespace || 'default';
      
      const result = await transferToPinecone(
        knowledgeBase.id, 
        selectedIndex, 
        namespace
      );
      
      if (result.success) {
        toast({
          title: 'Transfer initiated',
          description: 'Your documents are being transferred to Pinecone. This may take a few minutes.',
        });
        
        setShowTransferDialog(false);
      } else {
        throw new Error('Transfer failed');
      }
      
    } catch (error) {
      toast({
        title: 'Error transferring to Pinecone',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Pinecone Configuration</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadIndexes()}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> New Index
          </Button>
        </div>
      </div>
      
      <div className="space-y-4 bg-gray-800 p-4 rounded-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="indexSelect">Pinecone Index</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedIndex} 
              onValueChange={handleIndexSelect}
              disabled={loading}
            >
              <SelectTrigger id="indexSelect" className="flex-1 bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select an index" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                {Array.isArray(indexes) && indexes.length > 0 ? (
                  indexes.map(index => (
                    <SelectItem key={index.name} value={index.name}>
                      {index.name} ({index.dimension}d)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-indexes" disabled>No indexes available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedIndex && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleDeleteIndex(selectedIndex)}
                disabled={loading}
                className="bg-red-950 hover:bg-red-900 text-red-400 border-red-900"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {selectedIndex && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="namespaceSelect">Namespace</Label>
            <div className="flex gap-2">
              <Select 
                value={selectedNamespace || 'default-namespace'} 
                onValueChange={handleNamespaceSelect}
                disabled={indexLoading}
              >
                <SelectTrigger id="namespaceSelect" className="flex-1 bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Select a namespace" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  {Array.isArray(namespaces) && namespaces.length > 0 ? (
                    namespaces.map(ns => (
                      <SelectItem key={ns || 'default-namespace'} value={ns || 'default-namespace'}>
                        {ns || '(default namespace)'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-namespaces" disabled>No namespaces available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Input
                className="flex-1 bg-gray-900 border-gray-700 text-white"
                placeholder="Add a new namespace"
                value={namespaceInput}
                onChange={(e) => setNamespaceInput(e.target.value)}
              />
              <Button 
                variant="outline" 
                onClick={handleAddNamespace}
                disabled={!namespaceInput}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {selectedIndex && selectedNamespace && knowledgeBase && (
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
          onClick={() => setShowTransferDialog(true)}
        >
          Transfer Documents to Pinecone
        </Button>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Pinecone Index</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="indexName">Index Name</Label>
              <Input 
                id="indexName" 
                value={newIndexData.name}
                onChange={(e) => setNewIndexData({...newIndexData, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="my-index"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimension">Dimensions</Label>
              <Select 
                value={newIndexData.dimension.toString()} 
                onValueChange={(val) => setNewIndexData({...newIndexData, dimension: parseInt(val)})}
              >
                <SelectTrigger id="dimension" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select dimensions" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="384">384 (small)</SelectItem>
                  <SelectItem value="768">768 (medium)</SelectItem>
                  <SelectItem value="1536">1536 (OpenAI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select 
                value={newIndexData.region} 
                onValueChange={(val) => setNewIndexData({...newIndexData, region: val})}
              >
                <SelectTrigger id="region" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)} 
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateIndex} 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> :
                'Create Index'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Transfer Documents to Pinecone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-400">
              This will transfer all document embeddings from this knowledge base to the selected Pinecone index and namespace. 
              This operation may take several minutes depending on the number of documents.
            </p>
            <div className="bg-indigo-950/30 border border-indigo-800 p-3 rounded">
              <p className="font-medium">Selected Configuration:</p>
              <ul className="list-disc list-inside text-sm">
                <li>Index: <span className="text-indigo-400">{selectedIndex}</span></li>
                <li>Namespace: <span className="text-indigo-400">{selectedNamespace || '(default)'}</span></li>
                <li>Knowledge Base: <span className="text-indigo-400">{knowledgeBase?.name}</span></li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTransferDialog(false)} 
              className="border-gray-700 text-gray-300"
              disabled={transferLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTransferToPinecone} 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={transferLoading}
            >
              {transferLoading ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</> :
                'Start Transfer'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PineconeConfig;
