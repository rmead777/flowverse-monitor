
import { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NodeDetails from '../NodeDetails';
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
      case 'systemPrompt':
      case 'userInput':
      case 'aiResponse':
      case 'action':
      case 'apiCall':
      case 'configuration':
      case 'input':
      case 'process':
      case 'output':
      case 'ai':
      case 'retriever':
      case 'contextManager':
      case 'feedback':
        return <NodeDetails 
          node={selectedNode} 
          onClose={onClose}
          onMetricsUpdate={() => onUpdateNode(selectedNode.data)} 
        />;
      case 'ranker':
        return (
          <RankerNodeProperties
            nodeData={selectedNode.data}
            onUpdateNode={onUpdateNode}
          />
        );
      default:
        return <NodeDetails 
          node={selectedNode} 
          onClose={onClose} 
          onMetricsUpdate={() => onUpdateNode(selectedNode.data)}
        />;
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
