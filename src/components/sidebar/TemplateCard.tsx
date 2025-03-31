
import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TemplateCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

const TemplateCard = ({ title, description, icon, onClick }: TemplateCardProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="flex flex-col items-center justify-center w-full p-3 rounded-md transition-colors hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label={`${title} template: ${description}`}
          >
            <div className="rounded-md bg-gray-800 p-2 text-white mb-2">
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-300">{title}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TemplateCard;
