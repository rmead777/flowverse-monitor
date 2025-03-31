
import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NodeTypeItemProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  onDragStart: (event: React.DragEvent) => void;
}

const NodeTypeItem = ({ title, description, icon, color, onDragStart }: NodeTypeItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={onDragStart}
            className="flex items-center gap-3 p-2 rounded-md cursor-grab transition-colors hover:bg-gray-800 focus-within:bg-gray-800"
            style={{ borderLeft: `3px solid ${color}` }}
            aria-label={`Drag ${title} node: ${description}`}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // Create a mock drag event when using keyboard
                const mockEvent = new Event('dragstart') as unknown as React.DragEvent;
                onDragStart(mockEvent);
              }
            }}
          >
            <div className="flex-shrink-0 text-white" style={{ color }}>
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-300">{title}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NodeTypeItem;
