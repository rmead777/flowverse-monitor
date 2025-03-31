
import { memo, useState } from 'react';
import { 
  FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import NodeDetailsInline from './NodeDetailsInline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ContextManagerNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const ContextManagerNodeProperties = ({ nodeData, onUpdateNode }: ContextManagerNodePropertiesProps) => {
  const [isViewContextOpen, setIsViewContextOpen] = useState(false);
  
  // Mock context history for demo
  const contextHistory = [
    { timestamp: '2023-10-12 10:15', query: 'What is our financial outlook?', response: 'Based on the documents, your financial outlook shows steady growth...' },
    { timestamp: '2023-10-12 10:17', query: 'How can we improve cash flow?', response: 'To improve cash flow, consider these strategies from your financial reports...' },
    { timestamp: '2023-10-12 10:20', query: 'What are our top expenses?', response: 'According to the financial data, your top expenses are...' },
  ];

  // Define form schema
  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    contextWindow: z.number().min(1).max(10),
    storageMethod: z.string(),
    contextFormat: z.string(),
  });

  // Default values
  const defaultValues = {
    label: nodeData.label || 'Context Manager',
    contextWindow: nodeData.contextWindow || 5,
    storageMethod: nodeData.storageMethod || 'supabase',
    contextFormat: nodeData.contextFormat || 'Previous conversation: [context]\nQuery: [current query]',
  };

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      label: values.label,
      contextWindow: values.contextWindow,
      storageMethod: values.storageMethod,
      contextFormat: values.contextFormat,
    };
    onUpdateNode(updatedData);
  };

  const handleClearContext = () => {
    // In a real implementation, this would clear the context history
    console.log('Clearing context history');
    // You might want to add a confirmation dialog here
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">Context Manager Properties</div>
      
      <NodeDetailsInline 
        node={{ data: nodeData }} 
        onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)}
      />
      
      <Form {...form}>
        <form onChange={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Node Label</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contextWindow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context Window: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="py-4"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Number of conversation turns to include in context (1-10)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="storageMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Method</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select storage method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="in-memory">In-memory</SelectItem>
                    <SelectItem value="supabase">Supabase</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Where conversation context will be stored
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contextFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context Format</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    placeholder="Format for injecting context into prompts"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Format template for how context is presented to the AI model
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex space-x-3 pt-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleClearContext}
              className="flex-1"
            >
              Clear Context
            </Button>
            
            <Dialog open={isViewContextOpen} onOpenChange={setIsViewContextOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="flex-1"
                >
                  View Context
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Conversation Context History</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Recent conversation turns stored in context
                  </DialogDescription>
                </DialogHeader>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Timestamp</TableHead>
                      <TableHead className="text-white">Query</TableHead>
                      <TableHead className="text-white">Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contextHistory.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{entry.timestamp}</TableCell>
                        <TableCell>{entry.query}</TableCell>
                        <TableCell className="max-w-md truncate">{entry.response}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default memo(ContextManagerNodeProperties);
