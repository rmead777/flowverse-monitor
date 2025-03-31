
import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Custom type for JSON data
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Define types for our database tables
type AgentLogsType = {
  id: string;
  agent_name: string;
  event_type: string;
  details: Json;
  timestamp: string;
}

const NodeDetails = ({ node, onClose, onMetricsUpdate }) => {
  if (!node || !node.data) {
    return null;
  }

  const { data } = node;
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedData, setUpdatedData] = useState({
    label: data.label,
    status: data.status,
    metrics: { ...data.metrics }
  });
  const { toast } = useToast();

  const handleInputChange = (field, value) => {
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

  const handleStatusChange = (newStatus) => {
    setUpdatedData({
      ...updatedData,
      status: newStatus
    });
  };

  const restartAgent = async () => {
    setIsUpdating(true);
    
    try {
      // Log the restart event
      await supabase
        .from('agent_logs')
        .insert([{
          agent_name: data.label,
          event_type: 'agent_restart',
          details: { 
            node_id: node.id,
            previous_status: data.status 
          } as Json
        }]) as { error: any };
      
      // Update the status
      handleStatusChange('active');
      
      // Simulate a delay for the restart
      setTimeout(() => {
        setIsUpdating(false);
        toast({
          title: 'Agent restarted',
          description: `${data.label} has been restarted and is now active.`
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error restarting agent:', error);
      setIsUpdating(false);
      toast({
        title: 'Failed to restart agent',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const saveConfiguration = async () => {
    setIsUpdating(true);
    
    try {
      // Log the configuration change
      await supabase
        .from('agent_logs')
        .insert([{
          agent_name: data.label,
          event_type: 'config_update',
          details: { 
            node_id: node.id,
            previous_config: data,
            new_config: updatedData
          } as Json
        }]) as { error: any };
      
      // Simulate a delay for saving
      setTimeout(() => {
        setIsUpdating(false);
        onMetricsUpdate();
        toast({
          title: 'Configuration saved',
          description: `${updatedData.label} configuration has been updated.`
        });
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      setIsUpdating(false);
      toast({
        title: 'Failed to save configuration',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            <Input
              value={updatedData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              className="text-2xl font-bold px-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isUpdating}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Status</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('active')}
                    className={`px-2 py-1 rounded text-xs ${
                      updatedData.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleStatusChange('idle')}
                    className={`px-2 py-1 rounded text-xs ${
                      updatedData.status === 'idle'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => handleStatusChange('error')}
                    className={`px-2 py-1 rounded text-xs ${
                      updatedData.status === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Error
                  </button>
                </div>
              </div>
              <Progress
                value={
                  updatedData.status === 'active'
                    ? 100
                    : updatedData.status === 'idle'
                    ? 50
                    : 0
                }
                className={
                  updatedData.status === 'active'
                    ? 'bg-green-500'
                    : updatedData.status === 'idle'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tasks-processed">Tasks Processed</Label>
                <Input
                  id="tasks-processed"
                  type="number"
                  value={updatedData.metrics.tasksProcessed}
                  onChange={(e) =>
                    handleInputChange('metrics.tasksProcessed', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latency">Latency (ms)</Label>
                <Input
                  id="latency"
                  type="number"
                  value={updatedData.metrics.latency}
                  onChange={(e) =>
                    handleInputChange('metrics.latency', parseInt(e.target.value) || 0)
                  }
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
                  value={(updatedData.metrics.errorRate * 100).toFixed(1)}
                  onChange={(e) =>
                    handleInputChange(
                      'metrics.errorRate',
                      parseFloat(e.target.value) / 100 || 0
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="text-xl font-bold capitalize">{data.type}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={saveConfiguration}
              >
                {isUpdating ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                size="sm"
                className="flex items-center gap-1"
                disabled={isUpdating || updatedData.status === 'active'}
                onClick={restartAgent}
              >
                {isUpdating ? (
                  'Processing...'
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Restart Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeDetails;
