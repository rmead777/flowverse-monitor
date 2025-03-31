
import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Globe, Server } from 'lucide-react';

interface KnowledgeBaseItemProps {
  name: string;
  type: string;
  status: 'active' | 'indexing' | 'error';
  onClick: () => void;
}

const KnowledgeBaseItem = ({ name, type, status, onClick }: KnowledgeBaseItemProps) => {
  const getTypeIcon = (): ReactNode => {
    switch (type.toLowerCase()) {
      case 'pinecone':
        return <Server className="h-4 w-4" />;
      case 'weaviate':
        return <Globe className="h-4 w-4" />;
      case 'supabase':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'indexing':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-800 focus-within:bg-gray-800"
            aria-label={`Knowledge base: ${name}, type: ${type}, status: ${status}`}
            tabIndex={0}
            role="button"
          >
            <div className="flex-shrink-0 text-gray-400">
              {getTypeIcon()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-300 truncate">{name}</p>
              <p className="text-xs text-gray-500">{type}</p>
            </div>
            <div 
              className={`h-2 w-2 rounded-full ${getStatusColor()}`} 
              aria-label={`Status: ${status}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div>
            <p><strong>{name}</strong></p>
            <p>Type: {type}</p>
            <p>Status: <span className="capitalize">{status}</span></p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default KnowledgeBaseItem;
