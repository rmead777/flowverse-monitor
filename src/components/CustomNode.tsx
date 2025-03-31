
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

type MetricsType = {
  tasksProcessed: number;
  errorRate: number;
  latency: number;
};

type NodeData = {
  label: string;
  status: 'active' | 'idle' | 'error';
  type: 'input' | 'process' | 'output' | 'ai';
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
      
      {type !== 'input' && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3" 
          aria-label="Input connection"
        />
      )}
      {type !== 'output' && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3" 
          aria-label="Output connection"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
