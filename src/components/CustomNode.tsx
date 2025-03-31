
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ContextMenuTrigger } from '@/components/ui/context-menu';

type MetricsType = {
  tasksProcessed: number;
  errorRate: number;
  latency: number;
};

type NodeData = {
  label: string;
  status: 'active' | 'idle' | 'error';
  type: string;
  metrics: MetricsType;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'idle':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getNodeColor = (type: string) => {
  switch (type) {
    case 'systemPrompt':
      return 'bg-purple-900 border-purple-500'; // Purple for System Prompt
    case 'userInput':
      return 'bg-blue-900 border-blue-500'; // Blue for User Input
    case 'aiResponse':
      return 'bg-green-900 border-green-500'; // Green for AI Response
    case 'action':
      return 'bg-orange-900 border-orange-500'; // Orange for Action
    case 'apiCall':
      return 'bg-pink-900 border-pink-500'; // Pink for API Call
    case 'configuration':
      return 'bg-yellow-900 border-yellow-500'; // Yellow for Configuration
    case 'input':
      return 'bg-blue-900 border-blue-500';
    case 'process':
      return 'bg-purple-900 border-purple-500';
    case 'output':
      return 'bg-green-900 border-green-500';
    case 'ai':
      return 'bg-indigo-900 border-indigo-500';
    default:
      return 'bg-gray-900 border-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'idle':
      return 'Idle';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

const CustomNode = ({ data }: { data: NodeData }) => {
  const { label, status, type, metrics } = data;
  const statusText = getStatusText(status);

  return (
    <ContextMenuTrigger>
      <div 
        className={`px-4 py-3 rounded-lg shadow-lg border-2 ${getNodeColor(type)}`}
        role="button"
        tabIndex={0}
        aria-label={`${label} node, type: ${type}, status: ${statusText}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-bold text-sm sm:text-base">{label}</div>
          <div 
            className={`h-3 w-3 rounded-full ${getStatusColor(status)}`} 
            title={statusText}
            aria-label={`Status: ${statusText}`}
          />
        </div>
        <div className="text-xs text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span>Tasks:</span> 
            <span className="font-medium">{metrics.tasksProcessed}</span>
          </div>
          <div className="flex justify-between">
            <span>Error rate:</span> 
            <span className="font-medium">{(metrics.errorRate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Latency:</span> 
            <span className="font-medium">{metrics.latency}ms</span>
          </div>
        </div>
        
        {type !== 'input' && type !== 'systemPrompt' && type !== 'userInput' && (
          <Handle 
            type="target" 
            position={Position.Top} 
            className="w-3 h-3" 
            aria-label="Input connection"
          />
        )}
        {type !== 'output' && type !== 'aiResponse' && (
          <Handle 
            type="source" 
            position={Position.Bottom} 
            className="w-3 h-3" 
            aria-label="Output connection"
          />
        )}
      </div>
    </ContextMenuTrigger>
  );
};

export default memo(CustomNode);
