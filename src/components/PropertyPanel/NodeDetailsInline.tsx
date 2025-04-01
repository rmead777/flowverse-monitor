
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import NodeStatusControls from './NodeStatusControls';
import NodeMetricsDisplay from './NodeMetricsDisplay';

interface NodeDetailsInlineProps {
  node: any;
  onMetricsUpdate: (updatedData: any) => void;
}

const NodeDetailsInline = ({ node, onMetricsUpdate }: NodeDetailsInlineProps) => {
  if (!node || !node.data) {
    return null;
  }

  const { data } = node;
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [updatedData, setUpdatedData] = useState({
    label: data.label || '',
    status: data.status || 'idle',
    metrics: { 
      tasksProcessed: data.metrics?.tasksProcessed || 0,
      latency: data.metrics?.latency || 0,
      errorRate: data.metrics?.errorRate || 0 
    }
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('metrics.')) {
      const metricField = field.split('.')[1];
      setUpdatedData({
        ...updatedData,
        metrics: {
          ...updatedData.metrics,
          [metricField]: value
        }
      });
    } else {
      setUpdatedData({
        ...updatedData,
        [field]: value
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setUpdatedData({
      ...updatedData,
      status: newStatus
    });
    onMetricsUpdate({
      ...data,
      status: newStatus
    });
  };

  const saveChanges = () => {
    onMetricsUpdate({
      ...data,
      ...updatedData
    });
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-700 rounded-md bg-gray-800">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-3">
          <CollapsibleTrigger className="flex justify-between items-center w-full">
            <h3 className="text-sm font-medium text-gray-300">Node Status</h3>
            <div className="flex gap-2 items-center">
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    className="text-xs px-2 py-1 bg-green-600 rounded hover:bg-green-700 text-white"
                    onClick={saveChanges}
                  >
                    Save
                  </button>
                  <button 
                    className="text-xs px-2 py-1 bg-gray-600 rounded hover:bg-gray-700 text-white"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  Edit
                </button>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              {isEditing ? (
                <Input
                  value={updatedData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  className="h-8 text-sm bg-gray-700 border-gray-600"
                />
              ) : (
                <div className="text-sm text-white">{data.label || 'Unnamed Node'}</div>
              )}
            </div>
            
            <NodeStatusControls 
              status={data.status} 
              onStatusChange={handleStatusChange} 
            />
            
            <NodeMetricsDisplay 
              isEditing={isEditing}
              metrics={updatedData.metrics}
              onInputChange={handleInputChange}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default NodeDetailsInline;
