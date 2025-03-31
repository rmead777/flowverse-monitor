
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type NodeType = 'userInput' | 'systemPrompt' | 'aiResponse' | 'action' | 'apiCall' | 'configuration' | 'process';

interface NodeTypeOption {
  value: NodeType;
  label: string;
  description: string;
}

const nodeTypeOptions: NodeTypeOption[] = [
  {
    value: 'userInput',
    label: 'User Input',
    description: 'Handles user-provided data input.'
  },
  {
    value: 'systemPrompt',
    label: 'System Prompt',
    description: 'Defines AI behavior with system instructions.'
  },
  {
    value: 'aiResponse',
    label: 'AI Response',
    description: 'Generates AI output based on input.'
  },
  {
    value: 'action',
    label: 'Action',
    description: 'Performs operations on data.'
  },
  {
    value: 'apiCall',
    label: 'API Call',
    description: 'Makes external API requests.'
  },
  {
    value: 'configuration',
    label: 'Configuration',
    description: 'Configures system settings and parameters.'
  }
];

interface NodeTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: NodeType) => void;
}

const NodeTypeDialog = ({ isOpen, onClose, onSelectType }: NodeTypeDialogProps) => {
  const [selectedType, setSelectedType] = useState<NodeType>('userInput');

  const handleSubmit = () => {
    onSelectType(selectedType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Select Node Type</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose the type of node you want to add to your flow.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as NodeType)}
          className="grid grid-cols-1 gap-4 py-4"
        >
          {nodeTypeOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 rounded-md border border-gray-800 p-4 hover:bg-gray-800"
            >
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="border-gray-700 text-white [&_svg]:text-white [&_svg]:fill-white"
              />
              <div className="grid gap-1.5">
                <Label
                  htmlFor={option.value}
                  className="font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
            Add Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodeTypeDialog;
