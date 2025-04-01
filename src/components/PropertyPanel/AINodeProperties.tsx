import { memo, useState } from 'react';
import { 
  FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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

interface AINodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const models = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'groq-llama-3', name: 'Groq LLaMA 3' },
];

const responseFormats = [
  { id: 'plain', name: 'Plain text' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'json', name: 'JSON' },
];

const AINodeProperties = ({ nodeData, onUpdateNode }: AINodePropertiesProps) => {
  const [isTestGenerationModalOpen, setIsTestGenerationModalOpen] = useState(false);
  
  const generatedResponse = {
    text: `Based on the financial documents provided, here are the key recommendations for optimizing your operational expenses:

1. **Consolidate Software Subscriptions**
   - Current spend: $245,000/year
   - Potential savings: $68,000/year (28%)
   - Implementation timeline: 3 months

2. **Implement Automated Inventory Management**
   - Current manual process cost: $182,000/year
   - Automation implementation cost: $95,000 (one-time)
   - Potential annual savings: $124,000/year
   - ROI timeline: 9 months

3. **Renegotiate Top Supplier Contracts**
   - Potential savings: 7-12% on $1.2M annual spend
   - Estimated impact: $84,000-$144,000/year

These recommendations are based on your Q3 2023 financial reports and the operational efficiency analysis conducted in January 2024.`,
    
    sources: [
      { title: 'Q3 2023 Financial Report', relevance: 0.92, highlight: 'software subscription costs increased by 18% YoY' },
      { title: 'Operational Efficiency Analysis', relevance: 0.89, highlight: 'manual inventory processes account for 8% of operational expenses' },
      { title: 'Vendor Contract Review', relevance: 0.85, highlight: 'benchmark data suggests 7-12% savings opportunity with top 5 suppliers' },
    ]
  };

  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    model: z.string(),
    temperature: z.number().min(0).max(1),
    maxTokens: z.number().min(100).max(1000),
    responseFormat: z.string(),
  });

  const defaultValues = {
    label: nodeData.label || 'AI Response',
    model: nodeData.model || 'gpt-4o',
    temperature: nodeData.temperature !== undefined ? nodeData.temperature : 0.7,
    maxTokens: nodeData.maxTokens || 500,
    responseFormat: nodeData.responseFormat || 'plain',
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      label: values.label,
      model: values.model,
      temperature: values.temperature,
      maxTokens: values.maxTokens,
      responseFormat: values.responseFormat,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">AI Response Properties</div>
      
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
            name="model"
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
          
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value.toFixed(2)}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[field.value]}
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
            name="maxTokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={100}
                    max={1000}
                    step={50}
                    value={[field.value]}
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
            name="responseFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Response Format</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {responseFormats.map(format => (
                      <SelectItem key={format.id} value={format.id}>{format.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Output format for the AI response
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-3">
            <Dialog open={isTestGenerationModalOpen} onOpenChange={setIsTestGenerationModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="w-full"
                >
                  Test Generation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Test Generation Results</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Response generated for query: "How can we optimize operational expenses?"
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-gray-800 rounded-md border border-gray-700 whitespace-pre-wrap">
                    {generatedResponse.text}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Source Documents</h4>
                    {generatedResponse.sources.map((source, index) => (
                      <div key={index} className="p-3 bg-gray-800 rounded-md border border-gray-700">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{source.title}</span>
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                            {source.relevance.toFixed(2)} relevance
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">
                          "...{source.highlight}..."
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default memo(AINodeProperties);
