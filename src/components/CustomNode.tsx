
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

const CustomNode = ({ data }: { data: NodeData }) => {
  const { label, status, type, metrics } = data;

  return (
    <div className={`px-4 py-2 rounded-lg shadow-lg border-2 ${getNodeColor(type)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white font-bold">{label}</div>
        <div className={`h-3 w-3 rounded-full ${getStatusColor(status)}`} title={status} />
      </div>
      <div className="text-xs text-gray-300">
        <div>Tasks: {metrics.tasksProcessed}</div>
        <div>Error rate: {(metrics.errorRate * 100).toFixed(1)}%</div>
        <div>Latency: {metrics.latency}ms</div>
      </div>
      
      {type !== 'input' && (
        <Handle type="target" position={Position.Top} className="w-3 h-3" />
      )}
      {type !== 'output' && (
        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      )}
    </div>
  );
};

export default CustomNode;
