
import { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NodeDetails from './NodeDetailsInline';
import RankerNodeProperties from './RankerNodeProperties';

interface PropertyPanelProps {
  selectedNode: any;
  onUpdateNode: (data: any) => void;
  onClose: () => void;
}

const PropertyPanel = ({ selectedNode, onUpdateNode, onClose }: PropertyPanelProps) => {
  if (!selectedNode) {
    return null;
  }

  const renderProperties = () => {
    switch (selectedNode.data.type) {
      case 'ranker':
        return (
          <RankerNodeProperties
            nodeData={selectedNode.data}
            onUpdateNode={(updatedData) => onUpdateNode(updatedData)}
          />
        );
      case 'ai':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-white mb-4">AI Node Properties</div>
            <NodeDetails 
              node={selectedNode} 
              onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)} 
            />
            {/* AI-specific properties would go here */}
            <div className="p-3 border border-gray-700 rounded-md bg-gray-800 mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">AI Model Configuration</h3>
              <div className="text-xs text-gray-400">
                Note: AI model configuration options will be implemented in a future update.
              </div>
            </div>
          </div>
        );
      case 'retriever':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-white mb-4">Retriever Node Properties</div>
            <NodeDetails 
              node={selectedNode} 
              onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)} 
            />
            {/* Retriever-specific properties would go here */}
            <div className="p-3 border border-gray-700 rounded-md bg-gray-800 mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Vector Database Settings</h3>
              <div className="text-xs text-gray-400">
                Note: Vector database configuration options will be implemented in a future update.
              </div>
            </div>
          </div>
        );
      case 'systemPrompt':
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-white mb-4">System Prompt Properties</div>
            <NodeDetails 
              node={selectedNode} 
              onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)} 
            />
            {/* System Prompt-specific properties would go here */}
            <div className="p-3 border border-gray-700 rounded-md bg-gray-800 mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Prompt Template</h3>
              <div className="text-xs text-gray-400">
                Note: Prompt template configuration will be implemented in a future update.
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-white mb-4">{selectedNode.data.type} Properties</div>
            <NodeDetails 
              node={selectedNode} 
              onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)}
            />
            <div className="p-3 border border-gray-700 rounded-md bg-gray-800 mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Node Configuration</h3>
              <div className="text-xs text-gray-400">
                Note: Specific configuration options for this node type will be implemented in a future update.
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Properties</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 text-gray-400 hover:text-white" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderProperties()}
      </div>
    </div>
  );
};

export default memo(PropertyPanel);
