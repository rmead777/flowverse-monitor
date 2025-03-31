
import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader } from 'lucide-react';

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

interface SaveFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  isLoading: boolean;
  existingFlows: FlowConfigurationType[];
}

const SaveFlowDialog = ({ isOpen, onClose, onSave, isLoading, existingFlows }: SaveFlowDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSave = () => {
    // Validate flow name
    if (!name.trim()) {
      setNameError('Flow name is required');
      return;
    }

    // Check for duplicate names
    const isDuplicate = existingFlows.some(
      (flow) => flow.name.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
      setNameError('A flow with this name already exists');
      return;
    }

    onSave(name, description);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Flow Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Flow Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder="Enter a name for your flow"
              disabled={isLoading}
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your flow"
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Flow'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFlowDialog;
