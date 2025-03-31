
import { memo, useState, useEffect } from 'react';
import { 
  FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import NodeDetailsInline from './NodeDetailsInline';

interface ConfigurationNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const models = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'groq-llama-3', name: 'Groq LLaMA 3' },
];

const ConfigurationNodeProperties = ({ nodeData, onUpdateNode }: ConfigurationNodePropertiesProps) => {
  // Define form schema
  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    targetNodes: z.array(z.string()),
    retrieverSettings: z.object({
      similarityThreshold: z.number().min(0).max(1),
      numResults: z.number().min(1).max(20),
    }).optional(),
    aiResponseSettings: z.object({
      temperature: z.number().min(0).max(1),
      maxTokens: z.number().min(100).max(1000),
      model: z.string(),
    }).optional(),
  });

  // Determine if targets are selected
  const [selectedTargets, setSelectedTargets] = useState<string[]>(
    nodeData.targetNodes || ['retriever', 'aiResponse']
  );

  // Default values
  const defaultValues = {
    label: nodeData.label || 'Configuration',
    targetNodes: nodeData.targetNodes || ['retriever', 'aiResponse'],
    retrieverSettings: nodeData.retrieverSettings || {
      similarityThreshold: 0.8,
      numResults: 10
    },
    aiResponseSettings: nodeData.aiResponseSettings || {
      temperature: 0.7,
      maxTokens: 500,
      model: 'gpt-4o'
    }
  };

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Update selected targets when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'targetNodes') {
        setSelectedTargets(value.targetNodes as string[]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      label: values.label,
      targetNodes: values.targetNodes,
      retrieverSettings: values.retrieverSettings,
      aiResponseSettings: values.aiResponseSettings,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">Configuration Properties</div>
      
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
          
          <div className="space-y-3">
            <FormLabel>Target Nodes</FormLabel>
            <FormField
              control={form.control}
              name="targetNodes"
              render={({ field }) => {
                return (
                  <>
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes('retriever')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value || [], 'retriever']);
                            } else {
                              field.onChange(field.value?.filter(v => v !== 'retriever') || []);
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Retriever
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes('aiResponse')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value || [], 'aiResponse']);
                            } else {
                              field.onChange(field.value?.filter(v => v !== 'aiResponse') || []);
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        AI Response
                      </FormLabel>
                    </FormItem>
                  </>
                )
              }}
            />
            <FormDescription className="text-gray-400">
              Nodes that will be configured by this configuration node
            </FormDescription>
          </div>

          {selectedTargets.includes('retriever') && (
            <div className="space-y-4 p-3 border border-gray-700 rounded-md">
              <h4 className="font-medium text-sm">Retriever Settings</h4>
              
              <FormField
                control={form.control}
                name="retrieverSettings.similarityThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Similarity Threshold: {field.value?.toFixed(2)}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[field.value || 0.8]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Minimum similarity score for documents (0.0-1.0)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="retrieverSettings.numResults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Results: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={20}
                        step={1}
                        value={[field.value || 10]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Maximum number of documents to retrieve (1-20)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {selectedTargets.includes('aiResponse') && (
            <div className="space-y-4 p-3 border border-gray-700 rounded-md">
              <h4 className="font-medium text-sm">AI Response Settings</h4>
              
              <FormField
                control={form.control}
                name="aiResponseSettings.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature: {field.value?.toFixed(2)}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[field.value || 0.7]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Controls randomness in generation (0.0-1.0)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aiResponseSettings.maxTokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={100}
                        max={1000}
                        step={50}
                        value={[field.value || 500]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Maximum length of generated response (100-1000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aiResponseSettings.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Selection</FormLabel>
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
                        {models.map(model => (
                          <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-400">
                      AI model used for response generation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default memo(ConfigurationNodeProperties);
