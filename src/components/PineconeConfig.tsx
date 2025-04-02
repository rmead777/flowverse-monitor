
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { KnowledgeBase, PineconeIndex } from '@/types/knowledgeBase';
import { toast } from '@/hooks/use-toast';

interface PineconeConfigProps {
  knowledgeBase: KnowledgeBase;
  onUpdateConfig: (config: Record<string, any>) => void;
}

const PineconeConfig: React.FC<PineconeConfigProps> = ({ knowledgeBase, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<string>("indexes");
  const [selectedIndex, setSelectedIndex] = useState<string>(
    knowledgeBase.config?.pineconeIndex || ""
  );
  const [namespace, setNamespace] = useState<string>(
    knowledgeBase.config?.namespace || ""
  );
  const [newIndexName, setNewIndexName] = useState<string>("");
  const [newIndexDimension, setNewIndexDimension] = useState<number>(1536);
  const [availableNamespaces, setAvailableNamespaces] = useState<string[]>([]);
  const [indexStats, setIndexStats] = useState<any>(null);
  const [transferring, setTransferring] = useState<boolean>(false);

  const {
    listPineconeIndexes,
    isListingPineconeIndexes,
    createPineconeIndex,
    isCreatingPineconeIndex,
    deletePineconeIndex,
    isDeletingPineconeIndex,
    describePineconeIndex,
    isDescribingPineconeIndex,
    listPineconeNamespaces,
    isListingPineconeNamespaces,
    getPineconeStats,
    isGettingPineconeStats,
    transferToPinecone,
    isTransferringToPinecone
  } = useKnowledgeBase();

  // State for available indexes
  const [availableIndexes, setAvailableIndexes] = useState<PineconeIndex[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load available indexes
  useEffect(() => {
    fetchIndexes();
  }, []);

  // When selected index changes, fetch namespaces
  useEffect(() => {
    if (selectedIndex) {
      fetchNamespaces();
    } else {
      setAvailableNamespaces([]);
      setIndexStats(null);
    }
  }, [selectedIndex]);

  const fetchIndexes = async () => {
    setIsLoading(true);
    try {
      await listPineconeIndexes((indexes) => {
        if (indexes && Array.isArray(indexes)) {
          setAvailableIndexes(indexes);
          
          // If we have a current index in the config but it's not in the list, add it
          if (knowledgeBase.config?.pineconeIndex && !indexes.some(idx => idx.name === knowledgeBase.config.pineconeIndex)) {
            setAvailableIndexes(prev => [...prev, { 
              name: knowledgeBase.config.pineconeIndex,
              status: 'unknown'
            }]);
          }
          
          console.log("Available indexes:", indexes);
        } else {
          console.error("Invalid response format from listPineconeIndexes:", indexes);
          setAvailableIndexes([]);
        }
      });
    } catch (error) {
      console.error("Error fetching Pinecone indexes:", error);
      toast({
        title: "Error Fetching Indexes",
        description: "Could not retrieve Pinecone indexes. Please check your API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNamespaces = async () => {
    if (!selectedIndex) return;
    
    try {
      await listPineconeNamespaces(selectedIndex, (data) => {
        if (data && Array.isArray(data.namespaces)) {
          setAvailableNamespaces(data.namespaces);
          setIndexStats(data.stats);
          console.log("Available namespaces:", data.namespaces);
          console.log("Index stats:", data.stats);
        } else {
          console.error("Invalid response format from listPineconeNamespaces:", data);
          setAvailableNamespaces([]);
          setIndexStats(null);
        }
      });
    } catch (error) {
      console.error("Error fetching Pinecone namespaces:", error);
      toast({
        title: "Error Fetching Namespaces",
        description: "Could not retrieve namespaces for the selected index.",
        variant: "destructive"
      });
    }
  };

  const handleCreateIndex = async () => {
    if (!newIndexName) {
      toast({
        title: "Index Name Required",
        description: "Please provide a name for the new index.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createPineconeIndex({
        name: newIndexName,
        dimension: newIndexDimension,
        serverless: true
      });
      
      toast({
        title: "Index Creation Started",
        description: "The Pinecone index is being created. This may take a few minutes to complete.",
      });
      
      setNewIndexName("");
      
      // Wait a bit and refresh the list
      setTimeout(() => {
        fetchIndexes();
      }, 5000);
    } catch (error) {
      console.error("Error creating Pinecone index:", error);
      toast({
        title: "Error Creating Index",
        description: error.message || "Failed to create the Pinecone index.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteIndex = async (indexName: string) => {
    if (!indexName) return;
    
    if (!confirm(`Are you sure you want to delete the index "${indexName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePineconeIndex(indexName);
      toast({
        title: "Index Deleted",
        description: `The index "${indexName}" has been deleted.`,
      });
      
      // Clear selected index if it was the one deleted
      if (selectedIndex === indexName) {
        setSelectedIndex("");
        setNamespace("");
      }
      
      // Refresh the list
      fetchIndexes();
    } catch (error) {
      console.error("Error deleting Pinecone index:", error);
      toast({
        title: "Error Deleting Index",
        description: error.message || "Failed to delete the Pinecone index.",
        variant: "destructive"
      });
    }
  };

  const handleTransferData = async () => {
    if (!selectedIndex) {
      toast({
        title: "Index Required",
        description: "Please select a Pinecone index first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setTransferring(true);
      await transferToPinecone({
        knowledgeBaseId: knowledgeBase.id,
        indexName: selectedIndex,
        namespace: namespace || "default"
      });
      
      // Update knowledge base config
      const updatedConfig = {
        ...knowledgeBase.config,
        pineconeIndex: selectedIndex,
        namespace: namespace || "default"
      };
      
      onUpdateConfig(updatedConfig);
      
      toast({
        title: "Transfer Initiated",
        description: "Document vectors are being transferred to Pinecone. This may take a few minutes.",
      });
    } catch (error) {
      console.error("Error transferring to Pinecone:", error);
      toast({
        title: "Transfer Error",
        description: error.message || "Failed to transfer data to Pinecone.",
        variant: "destructive"
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleSaveConfig = () => {
    if (!selectedIndex) {
      toast({
        title: "Index Required",
        description: "Please select a Pinecone index first.",
        variant: "destructive"
      });
      return;
    }

    const updatedConfig = {
      ...knowledgeBase.config,
      pineconeIndex: selectedIndex,
      namespace: namespace || "default"
    };
    
    onUpdateConfig(updatedConfig);
    
    toast({
      title: "Configuration Saved",
      description: "Pinecone configuration has been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="indexes">Pinecone Indexes</TabsTrigger>
          <TabsTrigger value="transfer">Data Transfer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="indexes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Available Indexes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIndexes}
              disabled={isListingPineconeIndexes || isLoading}
            >
              {isListingPineconeIndexes || isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-gray-400 mt-2">Loading indexes...</p>
              </div>
            ) : availableIndexes.length > 0 ? (
              <div className="grid gap-2">
                {availableIndexes.map((index) => (
                  <div
                    key={index.name}
                    className="flex justify-between items-center p-3 bg-gray-800 rounded-md border border-gray-700"
                  >
                    <div className="flex items-center">
                      <div className="ml-2">
                        <p className="font-medium">{index.name}</p>
                        <p className="text-xs text-gray-400">
                          Status: {index.status || "unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteIndex(index.name)}
                        disabled={isDeletingPineconeIndex}
                      >
                        Delete
                      </Button>
                      <Button
                        variant={selectedIndex === index.name ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setSelectedIndex(index.name)}
                      >
                        {selectedIndex === index.name ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center bg-gray-800 rounded-md border border-gray-700">
                <p className="text-gray-400">No Pinecone indexes found</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-800 rounded-md border border-gray-700 mt-6">
            <h3 className="text-md font-medium mb-4">Create New Index</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="index-name">Index Name</Label>
                <Input
                  id="index-name"
                  placeholder="my-new-index"
                  value={newIndexName}
                  onChange={(e) => setNewIndexName(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dimension">Vector Dimension</Label>
                <Input
                  id="dimension"
                  type="number"
                  placeholder="1536"
                  value={newIndexDimension}
                  onChange={(e) => setNewIndexDimension(parseInt(e.target.value, 10))}
                  className="bg-gray-700 border-gray-600"
                />
                <p className="text-xs text-gray-400">
                  Use 1536 for OpenAI embeddings
                </p>
              </div>
              <Button
                onClick={handleCreateIndex}
                disabled={isCreatingPineconeIndex || !newIndexName}
                className="w-full"
              >
                {isCreatingPineconeIndex ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Index
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transfer" className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-md border border-gray-700">
            <h3 className="text-md font-medium mb-4">Configure Pinecone Connection</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="selected-index">Selected Index</Label>
                <Select
                  value={selectedIndex}
                  onValueChange={setSelectedIndex}
                >
                  <SelectTrigger id="selected-index" className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select an index" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {availableIndexes.map((index) => (
                      <SelectItem key={index.name} value={index.name}>
                        {index.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="namespace">Namespace (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="namespace"
                    placeholder="default"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="bg-gray-700 border-gray-600 flex-1"
                  />
                  {availableNamespaces.length > 0 && (
                    <Select
                      value=""
                      onValueChange={(value) => setNamespace(value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 w-[180px]">
                        <SelectValue placeholder="Existing namespaces" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {availableNamespaces.map((ns) => (
                          <SelectItem key={ns} value={ns}>
                            {ns || "(default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Leave empty for the default namespace
                </p>
              </div>
              
              <Button
                onClick={handleSaveConfig}
                disabled={!selectedIndex}
                className="w-full"
              >
                Save Configuration
              </Button>
            </div>
          </div>
          
          {selectedIndex && (
            <div className="p-4 bg-gray-800 rounded-md border border-gray-700">
              <h3 className="text-md font-medium mb-4">Transfer Documents to Pinecone</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Current Status:</span>
                  <div className="flex items-center">
                    {knowledgeBase.status === 'active' && knowledgeBase.config?.pineconeIndex === selectedIndex ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-green-500">Connected to {selectedIndex}</span>
                      </>
                    ) : knowledgeBase.status === 'indexing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-500 mr-1" />
                        <span className="text-yellow-500">Indexing in progress</span>
                      </>
                    ) : knowledgeBase.status === 'error' ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-red-500">Error: {knowledgeBase.config?.error || 'Unknown error'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">Not connected</span>
                      </>
                    )}
                  </div>
                </div>
                
                {indexStats && (
                  <div className="text-sm text-gray-400 mb-4">
                    <div className="flex justify-between pb-1 border-b border-gray-700">
                      <span>Total vectors in index:</span>
                      <span>{indexStats.totalVectorCount.toLocaleString()}</span>
                    </div>
                    {indexStats.namespaces && namespace && indexStats.namespaces[namespace] && (
                      <div className="flex justify-between pt-1">
                        <span>Vectors in namespace:</span>
                        <span>{indexStats.namespaces[namespace].vectorCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleTransferData}
                disabled={transferring || isTransferringToPinecone || !selectedIndex}
                variant="secondary"
                className="w-full"
              >
                {transferring || isTransferringToPinecone ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Transfer Document Vectors to Pinecone
              </Button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                This will transfer all document vectors to the selected Pinecone index.
                Depending on the number of documents, this may take several minutes.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PineconeConfig;
