
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import NodeDetails from './NodeDetailsInline';

const formSchema = z.object({
  promptTemplate: z.string().min(1, "Prompt template is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  useVariables: z.boolean().default(true),
  isGlobal: z.boolean().default(false)
});

type SystemPromptPropertiesProps = {
  nodeData: any;
  onUpdateNode: (data: any) => void;
};

const SystemPromptProperties = ({ nodeData, onUpdateNode }: SystemPromptPropertiesProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptTemplate: nodeData.promptTemplate || "You are a helpful AI assistant. {{context}}",
      name: nodeData.name || "Default System Prompt",
      description: nodeData.description || "",
      useVariables: nodeData.useVariables !== false, // default to true
      isGlobal: nodeData.isGlobal || false
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const updatedData = {
        ...nodeData,
        ...values
      };
      onUpdateNode(updatedData);
      
      toast({
        title: 'System prompt updated',
        description: 'Your system prompt has been saved successfully.',
      });
      
      setIsSaving(false);
    }, 500);
  };

  const handleReset = () => {
    form.reset({
      promptTemplate: "You are a helpful AI assistant. {{context}}",
      name: "Default System Prompt",
      description: "",
      useVariables: true,
      isGlobal: false
    });
    
    toast({
      title: 'Reset to default',
      description: 'System prompt has been reset to default values.',
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-white mb-4">System Prompt Properties</div>
      
      <NodeDetails 
        node={{ id: nodeData.id, data: nodeData }} 
        onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)} 
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt Name</FormLabel>
                <FormControl>
                  <Input 
                    className="bg-gray-800 border-gray-700 text-white" 
                    placeholder="Enter a name for this prompt"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    className="bg-gray-800 border-gray-700 text-white" 
                    placeholder="What does this prompt do?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="promptTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt Template</FormLabel>
                <FormControl>
                  <Textarea 
                    className="bg-gray-800 border-gray-700 text-white min-h-32" 
                    placeholder="Enter your system prompt here"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Use {'{{variable}}'} syntax for dynamic content. Available variables: {'{{context}}'}, {'{{query}}'}, {'{{history}}'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="useVariables"
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
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Global Prompt</FormLabel>
                    <div className="text-xs text-gray-400">
                      Apply to all AI models
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex flex-col space-y-2 pt-2">
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Prompt'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white hover:bg-gray-700"
              onClick={handleReset}
            >
              Reset to Default
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SystemPromptProperties;
