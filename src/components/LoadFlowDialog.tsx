
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Clock, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

// Define types for our database tables
type FlowConfigurationType = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: any;
  edges: any;
  created_at: string;
  updated_at: string;
}

interface LoadFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (flowConfig: FlowConfigurationType) => void;
  isLoading: boolean;
  flows: FlowConfigurationType[];
  fetchFlows: () => Promise<void>;
}

const LoadFlowDialog = ({ isOpen, onClose, onLoad, isLoading, flows, fetchFlows }: LoadFlowDialogProps) => {
  useEffect(() => {
    if (isOpen) {
      fetchFlows();
    }
  }, [isOpen, fetchFlows]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load Saved Flow</DialogTitle>
        </DialogHeader>
        
        {flows.length === 0 ? (
          <div className="py-6 text-center text-gray-400">
            <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>No saved flows found</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-3">
              {flows.map((flow) => (
                <div 
                  key={flow.id} 
                  className="p-3 bg-gray-800 rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => onLoad(flow)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-white">{flow.name}</h3>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoad(flow);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Load flow</span>
                    </Button>
                  </div>
                  {flow.description && (
                    <p className="text-sm text-gray-400 mb-2">{flow.description}</p>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {format(new Date(flow.updated_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoadFlowDialog;
