
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

const NodeDetails = ({ node, onClose }) => {
  const { data } = node;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{data.label}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Status</span>
                <span className="capitalize">{data.status}</span>
              </div>
              <Progress value={data.status === 'active' ? 100 : data.status === 'idle' ? 50 : 0} 
                className={data.status === 'active' ? 'bg-green-500' : data.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Tasks Processed</div>
                <div className="text-2xl font-bold">{data.metrics.tasksProcessed}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Latency</div>
                <div className="text-2xl font-bold">{data.metrics.latency}ms</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Error Rate</div>
                <div className="text-2xl font-bold">{(data.metrics.errorRate * 100).toFixed(1)}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Type</div>
                <div className="text-2xl font-bold capitalize">{data.type}</div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm">Edit Configuration</Button>
              <Button size="sm">Restart Agent</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NodeDetails;
