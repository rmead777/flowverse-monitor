
import { Input } from '@/components/ui/input';

interface NodeMetricsDisplayProps {
  isEditing: boolean;
  metrics: {
    tasksProcessed: number;
    latency: number;
    errorRate: number;
  };
  onInputChange: (field: string, value: any) => void;
}

const NodeMetricsDisplay = ({ isEditing, metrics, onInputChange }: NodeMetricsDisplayProps) => {
  if (isEditing) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Tasks</label>
          <Input
            type="number"
            value={metrics.tasksProcessed}
            onChange={(e) => onInputChange('metrics.tasksProcessed', parseInt(e.target.value) || 0)}
            className="h-8 text-sm bg-gray-700 border-gray-600"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Latency (ms)</label>
          <Input
            type="number"
            value={metrics.latency}
            onChange={(e) => onInputChange('metrics.latency', parseInt(e.target.value) || 0)}
            className="h-8 text-sm bg-gray-700 border-gray-600"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Error Rate (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={(metrics.errorRate * 100).toFixed(1)}
            onChange={(e) => onInputChange('metrics.errorRate', parseFloat(e.target.value) / 100 || 0)}
            className="h-8 text-sm bg-gray-700 border-gray-600"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <div className="text-xs text-gray-400 mb-1">Tasks</div>
        <div className="text-sm text-white">{metrics.tasksProcessed}</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1">Latency</div>
        <div className="text-sm text-white">{metrics.latency}ms</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1">Error Rate</div>
        <div className="text-sm text-white">{(metrics.errorRate * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
};

export default NodeMetricsDisplay;
