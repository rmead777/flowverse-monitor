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
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import NodeDetailsInline from './NodeDetailsInline';

interface UserInputNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const preprocessingOptions = [
  { id: 'lowercase', label: 'Convert to lowercase' },
  { id: 'special_chars', label: 'Remove special characters' },
  { id: 'stop_words', label: 'Remove stop words' },
  { id: 'lemmatize', label: 'Lemmatize' },
];

const UserInputNodeProperties = ({ nodeData, onUpdateNode }: UserInputNodePropertiesProps) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    inputType: z.string(),
    preprocessing: z.array(z.string()),
    outputFormat: z.string(),
    errorHandling: z.boolean(),
  });

  const defaultValues = {
    label: nodeData.label || 'User Input',
    inputType: nodeData.inputType || 'text',
    preprocessing: nodeData.preprocessing ? 
      Array.isArray(nodeData.preprocessing) ? 
        nodeData.preprocessing : 
        [nodeData.preprocessing] : 
      ['lowercase', 'special_chars'],
    outputFormat: nodeData.outputFormat || 'raw',
    errorHandling: nodeData.errorHandling !== undefined ? nodeData.errorHandling : true,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      label: values.label,
      inputType: values.inputType,
      preprocessing: values.preprocessing,
      outputFormat: values.outputFormat,
      errorHandling: values.errorHandling,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">User Input Properties</div>
      
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
            name="inputType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Input Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select input type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Type of input the node will accept from users
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-3">
            <FormLabel>Preprocessing Steps</FormLabel>
            {preprocessingOptions.map((option) => (
              <FormField
                key={option.id}
                control={form.control}
                name="preprocessing"
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
              Preprocessing operations to apply to input text
            </FormDescription>
          </div>
          
          <FormField
            control={form.control}
            name="outputFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Format</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="raw">Raw text</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Format of the output data from this node
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="errorHandling"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Error Handling</FormLabel>
                  <FormDescription className="text-gray-400">
                    Enable error handling for this node
                  </FormDescription>
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
        </form>
      </Form>
    </div>
  );
};

export default memo(UserInputNodeProperties);
