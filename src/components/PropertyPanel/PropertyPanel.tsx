
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PropertyPanelProps {
  selectedNode: any;
  onUpdateNode: (updatedData: any) => void;
  onClose?: () => void;
}

const PropertyPanel = ({ selectedNode, onUpdateNode, onClose }: PropertyPanelProps) => {
  const [nodeData, setNodeData] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTestQuery, setShowTestQuery] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showContextView, setShowContextView] = useState(false);
  const [contextMessages, setContextMessages] = useState<any[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (selectedNode) {
      setNodeData({ ...selectedNode.data });
      setErrors({});
    } else {
      setNodeData(null);
    }
  }, [selectedNode]);

  const handleInputChange = (field: string, value: any) => {
    setNodeData((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMetricsChange = (field: string, value: any) => {
    setNodeData((prev: any) => {
      // Handle different metric structures for different node types
      const effectiveType = getNodeType();
      let metricsField = 'metrics';
      
      // Update the appropriate metrics field based on node type
      const updatedMetrics = { ...(prev.metrics || {}) };
      updatedMetrics[field] = value;
      
      return {
        ...prev,
        metrics: updatedMetrics
      };
    });
    
    // Clear errors for this field
    if (errors[`metrics.${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`metrics.${field}`];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Common validations
    if (!nodeData.label || nodeData.label.trim() === '') {
      newErrors.label = 'Label is required';
    }
    
    // Type-specific validations
    if (nodeData.type === 'systemPrompt' && (!nodeData.prompt || nodeData.prompt.trim() === '')) {
      newErrors.prompt = 'Prompt is required';
    }
    
    if (nodeData.type === 'aiResponse') {
      if (nodeData.temperature !== undefined && (nodeData.temperature < 0 || nodeData.temperature > 1)) {
        newErrors['temperature'] = 'Temperature must be between 0 and 1';
      }
      
      if (nodeData.maxTokens !== undefined && nodeData.maxTokens <= 0) {
        newErrors['maxTokens'] = 'Max tokens must be greater than 0';
      }
    }

    if (nodeData.type === 'retriever') {
      if (nodeData.numResults !== undefined && nodeData.numResults <= 0) {
        newErrors['numResults'] = 'Number of results must be greater than 0';
      }
      
      if (nodeData.similarityThreshold !== undefined && 
          (nodeData.similarityThreshold < 0 || nodeData.similarityThreshold > 1)) {
        newErrors['similarityThreshold'] = 'Similarity threshold must be between 0 and 1';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onUpdateNode(nodeData);
      toast({
        title: 'Changes Saved',
        description: `${nodeData.label} properties have been updated.`
      });
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive'
      });
    }
  };

  const getNodeType = () => {
    if (!nodeData) return null;
    
    // If the node has a specific "type" property, use that
    if (nodeData.type) {
      return nodeData.type;
    }
    
    // For template nodes that might not have a proper type field set
    // Infer type from the node's internal properties or visual type
    if (selectedNode.type === 'input' || nodeData.inputType !== undefined) {
      return 'userInput';
    } else if (selectedNode.type === 'output' || nodeData.model !== undefined) {
      return 'aiResponse';
    } else if (nodeData.prompt !== undefined) {
      return 'systemPrompt';
    } else if (nodeData.actionType !== undefined) {
      return 'action';
    } else if (nodeData.endpoint !== undefined) {
      return 'apiCall';
    } else if (nodeData.configType !== undefined) {
      return 'configuration';
    }
    
    // Default case, try to use the node's visual type
    return selectedNode.type || null;
  };

  const handleTestQuery = () => {
    if (!queryInput.trim()) {
      toast({
        title: 'Query Required',
        description: 'Please enter a query to test.',
        variant: 'destructive'
      });
      return;
    }

    // Mock test results based on knowledge base
    const mockResults = [
      {
        title: 'Document 1: Introduction to RAG',
        snippet: 'Retrieval-Augmented Generation (RAG) is a technique that combines retrieval-based and generative approaches...',
        score: 0.92,
      },
      {
        title: 'Document 2: Implementing RAG with Vector Databases',
        snippet: 'Vector databases such as Pinecone and Weaviate are commonly used for storing and retrieving document embeddings...',
        score: 0.87,
      },
      {
        title: 'Document 3: Evaluation Metrics for RAG Systems',
        snippet: 'Common metrics for evaluating RAG systems include Precision, Recall, and Mean Reciprocal Rank (MRR)...',
        score: 0.81,
      },
      {
        title: 'Document 4: Prompt Engineering for RAG',
        snippet: 'Effective prompt engineering is crucial for RAG systems to generate relevant and accurate responses...',
        score: 0.78,
      },
      {
        title: 'Document 5: Context Window Management',
        snippet: 'Managing the context window is important to ensure that the most relevant information is included in the LLM input...',
        score: 0.72,
      }
    ];

    setTestResults(mockResults);
    setShowTestQuery(true);

    // Update metrics based on the test
    const numRelevantResults = mockResults.filter(r => r.score > 0.8).length;
    const recallRate = numRelevantResults / mockResults.length;
    const retrievalLatency = Math.floor(Math.random() * 400) + 200; // Random latency between 200-600ms

    setNodeData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        recallRate,
        precision: 0.85,
        retrievalLatency
      }
    }));
  };

  const handleViewContext = () => {
    // Mock context data
    const mockContext = [
      { role: 'user', content: 'Hello, I need information about RAG systems.' },
      { role: 'assistant', content: 'I\'d be happy to help with information about Retrieval-Augmented Generation (RAG) systems. What specifically would you like to know?' },
      { role: 'user', content: 'How do they work with vector databases?' },
      { role: 'assistant', content: 'RAG systems use vector databases to store document embeddings. When a query comes in, the system converts it to a vector and searches for similar document vectors...' },
      { role: 'user', content: 'What are the best practices for implementation?' }
    ];

    setContextMessages(mockContext);
    setShowContextView(true);
  };

  const renderFieldsByType = () => {
    if (!nodeData) return null;

    // Get the effective node type, handling different node sources
    const effectiveType = getNodeType();

    switch (effectiveType) {
      case 'systemPrompt':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea 
                id="prompt"
                value={nodeData.prompt || ''}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                className="min-h-[100px]"
                placeholder="Enter the system prompt to define AI behavior..."
              />
              {errors.prompt && <p className="text-xs text-red-500">{errors.prompt}</p>}
            </div>
          </>
        );
        
      case 'userInput':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="inputType">Input Type</Label>
              <Select 
                value={nodeData.inputType || 'text'} 
                onValueChange={(value) => handleInputChange('inputType', value)}
              >
                <SelectTrigger id="inputType">
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preprocessing">Preprocessing Steps</Label>
              <Select 
                value={nodeData.preprocessing || 'none'} 
                onValueChange={(value) => handleInputChange('preprocessing', value)}
              >
                <SelectTrigger id="preprocessing">
                  <SelectValue placeholder="Select preprocessing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="trim">Trim Whitespace</SelectItem>
                  <SelectItem value="lowercase">Convert to Lowercase</SelectItem>
                  <SelectItem value="normalize">Normalize Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'aiResponse':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select 
                value={nodeData.model || 'gpt-4o'} 
                onValueChange={(value) => handleInputChange('model', value)}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="groq-llama3">Groq LLaMA 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {((nodeData.temperature ?? 0.7) * 100).toFixed(0)}%
              </Label>
              <Slider 
                id="temperature"
                value={[nodeData.temperature ?? 0.7]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => handleInputChange('temperature', value[0])}
              />
              {errors.temperature && <p className="text-xs text-red-500">{errors.temperature}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input 
                id="maxTokens"
                type="number"
                value={nodeData.maxTokens ?? 1024}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value) || 0)}
              />
              {errors.maxTokens && <p className="text-xs text-red-500">{errors.maxTokens}</p>}
            </div>
          </>
        );
        
      case 'retriever':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="knowledgeBase">Knowledge Base</Label>
              <Select 
                value={nodeData.knowledgeBase || ''} 
                onValueChange={(value) => handleInputChange('knowledgeBase', value)}
              >
                <SelectTrigger id="knowledgeBase">
                  <SelectValue placeholder="Select knowledge base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical Documentation">Technical Documentation</SelectItem>
                  <SelectItem value="Product Manuals">Product Manuals</SelectItem>
                  <SelectItem value="Customer Support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numResults">Number of Results</Label>
              <Input 
                id="numResults"
                type="number"
                value={nodeData.numResults ?? 5}
                onChange={(e) => handleInputChange('numResults', parseInt(e.target.value) || 0)}
              />
              {errors.numResults && <p className="text-xs text-red-500">{errors.numResults}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="similarityThreshold">
                Similarity Threshold: {((nodeData.similarityThreshold ?? 0.8) * 100).toFixed(0)}%
              </Label>
              <Slider 
                id="similarityThreshold"
                value={[nodeData.similarityThreshold ?? 0.8]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => handleInputChange('similarityThreshold', value[0])}
              />
              {errors.similarityThreshold && <p className="text-xs text-red-500">{errors.similarityThreshold}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filters">Filters (optional)</Label>
              <Input 
                id="filters"
                placeholder="E.g., 'Only documents from 2023 or later'"
                value={nodeData.filters ?? ''}
                onChange={(e) => handleInputChange('filters', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="embeddingModel">Embedding Model</Label>
              <Select 
                value={nodeData.embeddingModel || 'text-embedding-ada-002'} 
                onValueChange={(value) => handleInputChange('embeddingModel', value)}
              >
                <SelectTrigger id="embeddingModel">
                  <SelectValue placeholder="Select embedding model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-embedding-ada-002">OpenAI Ada 002</SelectItem>
                  <SelectItem value="sentence-transformers">Sentence Transformers</SelectItem>
                  <SelectItem value="huggingface-embeddings">HuggingFace Embeddings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4">
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter a test query..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                />
                <Button 
                  onClick={handleTestQuery}
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Test
                </Button>
              </div>
            </div>
          </>
        );

      case 'contextManager':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="contextWindow">Context Window (messages)</Label>
              <Input 
                id="contextWindow"
                type="number"
                value={nodeData.contextWindow ?? 5}
                onChange={(e) => handleInputChange('contextWindow', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contextStorage">Storage</Label>
              <Select 
                value={nodeData.contextStorage || 'in-memory'} 
                onValueChange={(value) => handleInputChange('contextStorage', value)}
              >
                <SelectTrigger id="contextStorage">
                  <SelectValue placeholder="Select storage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-memory">In-Memory</SelectItem>
                  <SelectItem value="supabase">Supabase</SelectItem>
                  <SelectItem value="redis">Redis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contextFormat">Context Format</Label>
              <Select 
                value={nodeData.contextFormat || 'prepend'} 
                onValueChange={(value) => handleInputChange('contextFormat', value)}
              >
                <SelectTrigger id="contextFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepend">Prepend to Prompt</SelectItem>
                  <SelectItem value="messages">Message Array</SelectItem>
                  <SelectItem value="summary">Summary Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={handleViewContext}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                View Context
              </Button>
            </div>
          </>
        );

      case 'feedback':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="feedbackType">Feedback Type</Label>
              <Select 
                value={nodeData.feedbackType || 'thumbsUpDown'} 
                onValueChange={(value) => handleInputChange('feedbackType', value)}
              >
                <SelectTrigger id="feedbackType">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thumbsUpDown">Thumbs Up/Down</SelectItem>
                  <SelectItem value="starRating">1-5 Stars</SelectItem>
                  <SelectItem value="textComment">Text Comment</SelectItem>
                  <SelectItem value="combined">Combined (Stars + Comment)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="storeFeedback">Store Feedback in Supabase</Label>
                <input
                  type="checkbox"
                  id="storeFeedback"
                  checked={nodeData.storeFeedback ?? true}
                  onChange={(e) => handleInputChange('storeFeedback', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                Feedback will be stored with Task ID, Query, Response, and Score
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedbackPrompt">Feedback Prompt (optional)</Label>
              <Input 
                id="feedbackPrompt"
                placeholder="E.g., 'Was this response helpful?'"
                value={nodeData.feedbackPrompt ?? ''}
                onChange={(e) => handleInputChange('feedbackPrompt', e.target.value)}
              />
            </div>
          </>
        );
        
      case 'action':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select 
                value={nodeData.actionType || 'transform'} 
                onValueChange={(value) => handleInputChange('actionType', value)}
              >
                <SelectTrigger id="actionType">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transform">Text Transform</SelectItem>
                  <SelectItem value="analyze">Text Analysis</SelectItem>
                  <SelectItem value="extract">Data Extraction</SelectItem>
                  <SelectItem value="format">Format Conversion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="actionParams">Parameters</Label>
              <Textarea 
                id="actionParams"
                value={nodeData.actionParams || ''}
                onChange={(e) => handleInputChange('actionParams', e.target.value)}
                placeholder="Enter parameters in JSON format..."
              />
            </div>
          </>
        );
        
      case 'apiCall':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input 
                id="endpoint"
                value={nodeData.endpoint || ''}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
                placeholder="https://api.example.com/v1/data"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select 
                value={nodeData.method || 'GET'} 
                onValueChange={(value) => handleInputChange('method', value)}
              >
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select HTTP method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="headers">Headers</Label>
              <Textarea 
                id="headers"
                value={nodeData.headers || ''}
                onChange={(e) => handleInputChange('headers', e.target.value)}
                placeholder="Enter headers in JSON format..."
              />
            </div>
          </>
        );
        
      case 'configuration':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="configType">Configuration Type</Label>
              <Select 
                value={nodeData.configType || 'modelParams'} 
                onValueChange={(value) => handleInputChange('configType', value)}
              >
                <SelectTrigger id="configType">
                  <SelectValue placeholder="Select configuration type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modelParams">Model Parameters</SelectItem>
                  <SelectItem value="systemSettings">System Settings</SelectItem>
                  <SelectItem value="outputFormat">Output Formatting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="configParams">Parameters</Label>
              <Textarea 
                id="configParams"
                value={nodeData.configParams || ''}
                onChange={(e) => handleInputChange('configParams', e.target.value)}
                placeholder="Enter configuration parameters in JSON format..."
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  if (!selectedNode) {
    return (
      <div className="h-full flex-shrink-0 w-64 bg-gray-950 border-l border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Properties</h2>
        </div>
        <div className="flex items-center justify-center h-full max-h-[80%] text-center text-gray-500 p-4">
          <p>No node selected. Click a node in the canvas to edit its properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-shrink-0 w-64 bg-gray-950 border-l border-gray-800 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Properties</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close properties panel">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {nodeData && (
        <div className="space-y-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium">
              Basic Settings
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input 
                  id="label"
                  value={nodeData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                />
                {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={nodeData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {renderFieldsByType()}
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium">
              Performance Metrics
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-4 space-y-4">
              {nodeData.type === 'retriever' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recall-rate">Recall Rate (%)</Label>
                    <Input
                      id="recall-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={nodeData.metrics?.recallRate ? (nodeData.metrics.recallRate * 100).toFixed(1) : "0.0"}
                      onChange={(e) => handleMetricsChange('recallRate', parseFloat(e.target.value) / 100 || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precision">Precision (%)</Label>
                    <Input
                      id="precision"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={nodeData.metrics?.precision ? (nodeData.metrics.precision * 100).toFixed(1) : "0.0"}
                      onChange={(e) => handleMetricsChange('precision', parseFloat(e.target.value) / 100 || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retrieval-latency">Retrieval Latency (ms)</Label>
                    <Input
                      id="retrieval-latency"
                      type="number"
                      value={nodeData.metrics?.retrievalLatency || 0}
                      onChange={(e) => handleMetricsChange('retrievalLatency', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </>
              )}
              
              {nodeData.type === 'aiResponse' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="response-relevance">Response Relevance (%)</Label>
                    <Input
                      id="response-relevance"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={nodeData.metrics?.responseRelevance ? (nodeData.metrics.responseRelevance * 100).toFixed(1) : "0.0"}
                      onChange={(e) => handleMetricsChange('responseRelevance', parseFloat(e.target.value) / 100 || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="response-length">Response Length (chars)</Label>
                    <Input
                      id="response-length"
                      type="number"
                      value={nodeData.metrics?.responseLength || 0}
                      onChange={(e) => handleMetricsChange('responseLength', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="generation-latency">Generation Latency (ms)</Label>
                    <Input
                      id="generation-latency"
                      type="number"
                      value={nodeData.metrics?.generationLatency || 0}
                      onChange={(e) => handleMetricsChange('generationLatency', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </>
              )}
              
              {nodeData.type === 'feedback' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="feedback-count">Feedback Count</Label>
                    <Input
                      id="feedback-count"
                      type="number"
                      value={nodeData.metrics?.feedbackCount || 0}
                      onChange={(e) => handleMetricsChange('feedbackCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="average-rating">Average Rating (out of 5)</Label>
                    <Input
                      id="average-rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={nodeData.metrics?.averageRating || 0}
                      onChange={(e) => handleMetricsChange('averageRating', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="positive-percentage">Positive Feedback (%)</Label>
                    <Input
                      id="positive-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={nodeData.metrics?.positivePercentage ? (nodeData.metrics.positivePercentage * 100).toFixed(1) : "0.0"}
                      onChange={(e) => handleMetricsChange('positivePercentage', parseFloat(e.target.value) / 100 || 0)}
                    />
                  </div>
                </>
              )}
              
              {nodeData.type === 'contextManager' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="context-size">Context Size (chars)</Label>
                    <Input
                      id="context-size"
                      type="number"
                      value={nodeData.metrics?.contextSize || 0}
                      onChange={(e) => handleMetricsChange('contextSize', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-count">Message Count</Label>
                    <Input
                      id="message-count"
                      type="number"
                      value={nodeData.metrics?.messageCount || 0}
                      onChange={(e) => handleMetricsChange('messageCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processing-time">Processing Time (ms)</Label>
                    <Input
                      id="processing-time"
                      type="number"
                      value={nodeData.metrics?.processingTime || 0}
                      onChange={(e) => handleMetricsChange('processingTime', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </>
              )}
              
              {(nodeData.type !== 'retriever' && 
                nodeData.type !== 'aiResponse' && 
                nodeData.type !== 'feedback' && 
                nodeData.type !== 'contextManager') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tasks-processed">Tasks Processed</Label>
                    <Input
                      id="tasks-processed"
                      type="number"
                      value={nodeData.metrics?.tasksProcessed || 0}
                      onChange={(e) => handleMetricsChange('tasksProcessed', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="error-rate">Error Rate (%)</Label>
                    <Input
                      id="error-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={nodeData.metrics?.errorRate ? (nodeData.metrics.errorRate * 100).toFixed(1) : "0.0"}
                      onChange={(e) => handleMetricsChange('errorRate', parseFloat(e.target.value) / 100 || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latency">Latency (ms)</Label>
                    <Input
                      id="latency"
                      type="number"
                      value={nodeData.metrics?.latency || 0}
                      onChange={(e) => handleMetricsChange('latency', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setNodeData({ ...selectedNode.data })}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Test Query Results Dialog */}
      <Dialog open={showTestQuery} onOpenChange={setShowTestQuery}>
        <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Test Query Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="p-3 bg-gray-800 rounded-md">
              <p className="font-semibold text-sm">Query</p>
              <p className="text-gray-300">{queryInput}</p>
            </div>
            
            <Table>
              <TableCaption>Top {testResults.length} documents retrieved</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Relevance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testResults.map((result, index) => (
                  <TableRow key={index} className={result.score < 0.75 ? "text-gray-500" : ""}>
                    <TableCell>
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{result.snippet}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={result.score >= 0.8 ? "bg-green-700" : result.score >= 0.6 ? "bg-yellow-700" : "bg-red-700"}>
                        {(result.score * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTestQuery(false)} className="bg-indigo-600 hover:bg-indigo-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Context View Dialog */}
      <Dialog open={showContextView} onOpenChange={setShowContextView}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Conversation Context</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {contextMessages.map((message, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-md ${message.role === 'user' ? 'bg-blue-900' : 'bg-gray-800'}`}
              >
                <p className="font-semibold text-xs text-gray-400 uppercase mb-1">{message.role}</p>
                <p className="text-gray-300">{message.content}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowContextView(false)} className="bg-indigo-600 hover:bg-indigo-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyPanel;
