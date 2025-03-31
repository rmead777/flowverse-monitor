
import { memo } from 'react';
import { 
  FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import NodeDetailsInline from './NodeDetailsInline';

interface FeedbackCollectorNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const feedbackFieldOptions = [
  { id: 'taskId', label: 'Task ID' },
  { id: 'query', label: 'Query' },
  { id: 'response', label: 'Response' },
  { id: 'feedbackScore', label: 'Feedback Score' },
  { id: 'comment', label: 'Comment' },
];

const FeedbackCollectorNodeProperties = ({ nodeData, onUpdateNode }: FeedbackCollectorNodePropertiesProps) => {
  // Define form schema
  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    feedbackType: z.string(),
    storageMethod: z.string(),
    feedbackFields: z.array(z.string()),
    feedbackPrompt: z.string(),
  });

  // Default values
  const defaultValues = {
    label: nodeData.label || 'Feedback Collector',
    feedbackType: nodeData.feedbackType || 'thumbsUpDown',
    storageMethod: nodeData.storageMethod || 'supabase',
    feedbackFields: nodeData.feedbackFields || ['taskId', 'query', 'response', 'feedbackScore'],
    feedbackPrompt: nodeData.feedbackPrompt || 'Was this response helpful? Please provide feedback.',
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
      feedbackType: values.feedbackType,
      storageMethod: values.storageMethod,
      feedbackFields: values.feedbackFields,
      feedbackPrompt: values.feedbackPrompt,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">Feedback Collector Properties</div>
      
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
            name="feedbackType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="thumbsUpDown">Thumbs up/down</SelectItem>
                    <SelectItem value="starRating">1-5 star rating</SelectItem>
                    <SelectItem value="textComment">Text comment</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Type of feedback to collect from users
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
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="localFile">Local file</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Where feedback data will be stored
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-3">
            <FormLabel>Feedback Fields</FormLabel>
            {feedbackFieldOptions.map((option) => (
              <FormField
                key={option.id}
                control={form.control}
                name="feedbackFields"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={option.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, option.id])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== option.id
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
            <FormDescription className="text-gray-400">
              Fields to include in feedback data
            </FormDescription>
          </div>
          
          <FormField
            control={form.control}
            name="feedbackPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Prompt</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter prompt to request feedback"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Text shown to users when requesting feedback
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};

export default memo(FeedbackCollectorNodeProperties);
