
import { memo, useState } from 'react';
import { 
  FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
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
import { Input } from '@/components/ui/input';

interface SystemPromptPropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const SystemPromptProperties = ({ nodeData, onUpdateNode }: SystemPromptPropertiesProps) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Mock response for the preview dialog
  const previewResponse = `Based on the financial reports for Q3 2023, I recommend focusing on three key areas to optimize operational expenses:

1. Reduce software licensing costs by consolidating redundant tools (potential savings: $45,000/year)
2. Implement the automated inventory management system to reduce carrying costs (potential savings: $120,000/year)
3. Negotiate with the top 3 suppliers for better payment terms (potential benefit: improved cash flow by 8%)

These recommendations align with your company's goal of reducing operational expenses by 12% while maintaining quality of service.`;

  // Define form schema
  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    prompt: z.string(),
    dynamicPrompting: z.boolean(),
  });

  // Default values
  const defaultValues = {
    label: nodeData.label || 'System Prompt',
    prompt: nodeData.prompt || 'You are a financial consultant specializing in operational optimization. Provide accurate and concise answers based on the provided documents.',
    dynamicPrompting: nodeData.dynamicPrompting || false,
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
      prompt: values.prompt,
      dynamicPrompting: values.dynamicPrompting,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">System Prompt Properties</div>
      
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
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt Text</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="bg-gray-800 border-gray-700 text-white min-h-[200px]"
                    placeholder="Enter system prompt text here..."
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Use {'{{variable}}'} syntax for dynamic content. Available variables: {'{{context}}'}, {'{{query}}'}, {'{{history}}'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dynamicPrompting"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Use Variables</FormLabel>
                  <div className="text-xs text-gray-400">
                    Process {'{{variable}}'} placeholders
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-3">
            <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="w-full"
                >
                  Preview Behavior
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Response Preview</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Sample response with current system prompt for query: "How can we reduce operational costs?"
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 p-4 bg-gray-800 rounded-md border border-gray-700 whitespace-pre-wrap">
                  {previewResponse}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default memo(SystemPromptProperties);
