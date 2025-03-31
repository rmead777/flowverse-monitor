
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ContextMenuTrigger } from '@/components/ui/context-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type MetricsType = {
  tasksProcessed?: number;
  errorRate?: number;
  latency?: number;
  recallRate?: number;
  precision?: number;
  retrievalLatency?: number;
  responseRelevance?: number;
  responseLength?: number;
  generationLatency?: number;
  feedbackCount?: number;
  averageRating?: number;
  positivePercentage?: number;
  contextSize?: number;
  messageCount?: number;
  processingTime?: number;
};

type NodeData = {
  label: string;
  status: 'active' | 'idle' | 'error';
  type: string;
  metrics: MetricsType;
  error?: string;
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
    case 'retriever':
      return 'bg-blue-900 border-blue-500'; // Blue for Retriever
    case 'contextManager':
      return 'bg-yellow-900 border-yellow-500'; // Yellow for Context Manager
    case 'feedback':
      return 'bg-green-900 border-green-500'; // Green for Feedback
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

const getMetricsForNodeType = (type: string, metrics: MetricsType) => {
  switch (type) {
    case 'retriever':
      return [
        { label: 'Recall Rate:', value: metrics.recallRate ? `${(metrics.recallRate * 100).toFixed(1)}%` : '0%', 
          warning: metrics.recallRate && metrics.recallRate < 0.7 },
        { label: 'Precision:', value: metrics.precision ? `${(metrics.precision * 100).toFixed(1)}%` : '0%',
          warning: metrics.precision && metrics.precision < 0.7 },
        { label: 'Latency:', value: metrics.retrievalLatency ? `${metrics.retrievalLatency}ms` : '0ms',
          warning: metrics.retrievalLatency && metrics.retrievalLatency > 1000 }
      ];
    case 'aiResponse':
      return [
        { label: 'Relevance:', value: metrics.responseRelevance ? `${(metrics.responseRelevance * 100).toFixed(1)}%` : '0%',
          warning: metrics.responseRelevance && metrics.responseRelevance < 0.7 },
        { label: 'Length:', value: metrics.responseLength ? `${metrics.responseLength} ch` : '0 ch' },
        { label: 'Latency:', value: metrics.generationLatency ? `${metrics.generationLatency}ms` : '0ms',
          warning: metrics.generationLatency && metrics.generationLatency > 2000 }
      ];
    case 'contextManager':
      return [
        { label: 'Context:', value: metrics.contextSize ? `${metrics.contextSize} ch` : '0 ch' },
        { label: 'Messages:', value: metrics.messageCount ? `${metrics.messageCount}` : '0' },
        { label: 'Process time:', value: metrics.processingTime ? `${metrics.processingTime}ms` : '0ms' }
      ];
    case 'feedback':
      return [
        { label: 'Feedback:', value: metrics.feedbackCount ? `${metrics.feedbackCount}` : '0' },
        { label: 'Avg Rating:', value: metrics.averageRating ? `${metrics.averageRating.toFixed(1)}/5` : '0/5' },
        { label: 'Positive:', value: metrics.positivePercentage ? `${(metrics.positivePercentage * 100).toFixed(1)}%` : '0%',
          warning: metrics.positivePercentage && metrics.positivePercentage < 0.7 }
      ];
    default:
      return [
        { label: 'Tasks:', value: metrics.tasksProcessed ? `${metrics.tasksProcessed}` : '0' },
        { label: 'Error rate:', value: metrics.errorRate ? `${(metrics.errorRate * 100).toFixed(1)}%` : '0%',
          warning: metrics.errorRate && metrics.errorRate > 0.1 },
        { label: 'Latency:', value: metrics.latency ? `${metrics.latency}ms` : '0ms',
          warning: metrics.latency && metrics.latency > 1000 }
      ];
  }
};

const CustomNode = ({ data }: { data: NodeData }) => {
  const { label, status, type, metrics, error } = data;
  const statusText = getStatusText(status);
  const isError = status === 'error';
  const nodeMetrics = getMetricsForNodeType(type, metrics);

  return (
    <TooltipProvider>
      <ContextMenuTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`px-4 py-3 rounded-lg shadow-lg border-2 ${getNodeColor(type)}`}
              role="button"
              tabIndex={0}
              aria-label={`${label} node, type: ${type}, status: ${statusText}`}
              style={{ borderColor: isError ? 'rgb(239, 68, 68)' : undefined }}
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
                {nodeMetrics.map((metric, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{metric.label}</span> 
                    <span className={`font-medium ${metric.warning ? 'text-red-400' : ''}`}>{metric.value}</span>
                  </div>
                ))}
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
          </TooltipTrigger>
          {isError && error && (
            <TooltipContent className="bg-red-900 border-red-600 text-white max-w-xs">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </ContextMenuTrigger>
    </TooltipProvider>
  );
};

export default memo(CustomNode);
