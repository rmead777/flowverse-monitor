
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import NodeDetails from './NodeDetailsInline';

const formSchema = z.object({
  model: z.string().default('gpt-4o-mini'),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().int().min(1).max(32000).default(2000),
  topP: z.coerce.number().min(0).max(1).default(1),
  frequencyPenalty: z.coerce.number().min(0).max(2).default(0),
  presencePenalty: z.coerce.number().min(0).max(2).default(0),
  streamResponse: z.boolean().default(true)
});

type AINodePropertiesProps = {
  nodeData: any;
  onUpdateNode: (data: any) => void;
};

const AINodeProperties = ({ nodeData, onUpdateNode }: AINodePropertiesProps) => {
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: nodeData.model || 'gpt-4o-mini',
      temperature: nodeData.temperature || 0.7,
      maxTokens: nodeData.maxTokens || 2000,
      topP: nodeData.topP || 1,
      frequencyPenalty: nodeData.frequencyPenalty || 0,
      presencePenalty: nodeData.presencePenalty || 0,
      streamResponse: nodeData.streamResponse !== false // default to true
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      ...values
    };
    onUpdateNode(updatedData);
    toast({
      title: 'AI node properties updated',
      description: 'AI node configuration has been updated.',
    });
  };

  const handleTestAI = () => {
    setIsTesting(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'AI model tested successfully',
        description: `${form.watch('model')} is working correctly with current settings.`,
      });
      setIsTesting(false);
      
      // Update metrics
      const updatedData = {
        ...nodeData,
        metrics: {
          ...nodeData.metrics,
          latency: 245,
          errorRate: 0.02,
          tasksProcessed: (nodeData.metrics?.tasksProcessed || 0) + 1
        }
      };
      onUpdateNode(updatedData);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-white mb-4">AI Node Properties</div>
      
      <NodeDetails 
        node={{ id: nodeData.id, data: nodeData }} 
        onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)} 
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Model</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="mistral-large">Mistral Large</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value}</FormLabel>
                <FormControl>
                  <Slider 
                    min={0} 
                    max={2}
                    step={0.1}
                    defaultValue={[field.value]} 
                    onValueChange={(vals) => field.onChange(vals[0])}
                    className="py-4"
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Deterministic (0)</span>
                  <span>Creative (2)</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="maxTokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    max="32000"
                    className="bg-gray-800 border-gray-700 text-white" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="topP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top P: {field.value}</FormLabel>
                  <FormControl>
                    <Slider 
                      min={0} 
                      max={1}
                      step={0.05}
                      defaultValue={[field.value]} 
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="frequencyPenalty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency Penalty: {field.value}</FormLabel>
                  <FormControl>
                    <Slider 
                      min={0} 
                      max={2}
                      step={0.1}
                      defaultValue={[field.value]} 
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="presencePenalty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presence Penalty: {field.value}</FormLabel>
                <FormControl>
                  <Slider 
                    min={0} 
                    max={2}
                    step={0.1}
                    defaultValue={[field.value]} 
                    onValueChange={(vals) => field.onChange(vals[0])}
                    className="py-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="streamResponse"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Stream Response</FormLabel>
                  <div className="text-xs text-gray-400">
                    Enable token streaming for faster responses
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
          
          <div className="flex flex-col space-y-2 pt-2">
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Configuration
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white hover:bg-gray-700"
              onClick={handleTestAI}
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test AI Model'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AINodeProperties;
