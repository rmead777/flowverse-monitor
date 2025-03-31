
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PropertyPanelProps {
  selectedNode: any;
  onUpdateNode: (updatedData: any) => void;
  onClose?: () => void;
}

const PropertyPanel = ({ selectedNode, onUpdateNode, onClose }: PropertyPanelProps) => {
  const [nodeData, setNodeData] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setNodeData((prev: any) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: value
      }
    }));
    
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

  const renderFieldsByType = () => {
    if (!nodeData) return null;

    switch (nodeData.type) {
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
                  value={(nodeData.metrics?.errorRate * 100).toFixed(1)}
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
    </div>
  );
};

export default PropertyPanel;
