
import { Progress } from '@/components/ui/progress';

interface NodeStatusControlsProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
}

const NodeStatusControls = ({ status, onStatusChange }: NodeStatusControlsProps) => {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Status</span>
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange('active')}
            className={`px-2 py-0.5 rounded text-xs ${
              status === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onStatusChange('idle')}
            className={`px-2 py-0.5 rounded text-xs ${
              status === 'idle'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Idle
          </button>
          <button
            onClick={() => onStatusChange('error')}
            className={`px-2 py-0.5 rounded text-xs ${
              status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Error
          </button>
        </div>
      </div>
      <Progress
        value={
          status === 'active'
            ? 100
            : status === 'idle'
            ? 50
            : 0
        }
        className={
          status === 'active'
            ? 'bg-green-500'
            : status === 'idle'
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }
      />
    </div>
  );
};

export default NodeStatusControls;
