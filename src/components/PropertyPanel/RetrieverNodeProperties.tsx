
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

interface RetrieverNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const knowledgeBases = [
  { id: 'financial_reports', name: 'Financial Reports' },
  { id: 'operational_procedures', name: 'Operational Procedures' },
  { id: 'market_analysis', name: 'Market Analysis' },
  { id: 'regulatory_compliance', name: 'Regulatory Compliance' },
];

const embeddingModels = [
  { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002' },
  { id: 'sentence-transformers', name: 'Sentence Transformers' },
];

const RetrieverNodeProperties = ({ nodeData, onUpdateNode }: RetrieverNodePropertiesProps) => {
  const [isTestQueryModalOpen, setIsTestQueryModalOpen] = useState(false);
  
  // Mock retrieved documents for the test query dialog
  const retrievedDocs = [
    { title: 'Q4 Financial Report 2023', snippet: 'Operating expenses decreased by 12% compared to Q3, primarily due to the implementation of...', relevanceScore: 0.92 },
    { title: 'Operational Efficiency Analysis', snippet: 'The new automated workflow resulted in a 15% increase in productivity across departments...', relevanceScore: 0.87 },
    { title: 'Annual Budget Projection 2024', snippet: 'Based on current trends, we project a 7% increase in revenue and a 3% decrease in costs...', relevanceScore: 0.81 },
  ];

  // Define form schema
  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    knowledgeBase: z.string(),
    numResults: z.number().min(1).max(20),
    similarityThreshold: z.number().min(0).max(1),
    filters: z.string().optional(),
    embeddingModel: z.string(),
  });

  // Default values
  const defaultValues = {
    label: nodeData.label || 'Retriever',
    knowledgeBase: nodeData.knowledgeBase || 'financial_reports',
    numResults: nodeData.numResults || 10,
    similarityThreshold: nodeData.similarityThreshold || 0.8,
    filters: nodeData.filters || 'metadata.year >= 2023',
    embeddingModel: nodeData.embeddingModel || 'text-embedding-ada-002',
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
      knowledgeBase: values.knowledgeBase,
      numResults: values.numResults,
      similarityThreshold: values.similarityThreshold,
      filters: values.filters,
      embeddingModel: values.embeddingModel,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">Retriever Properties</div>
      
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
            name="knowledgeBase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Knowledge Base</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select knowledge base" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {knowledgeBases.map(kb => (
                      <SelectItem key={kb.id} value={kb.id}>{kb.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Vector database to retrieve documents from
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="numResults"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Results: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={20}
                    step={1}
                    value={[field.value]}
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
          
          <FormField
            control={form.control}
            name="similarityThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Similarity Threshold: {field.value.toFixed(2)}</FormLabel>
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
                  Minimum similarity score for documents (0.0-1.0)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="filters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filters</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="metadata.year >= 2023"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Optional metadata filters for document retrieval
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="embeddingModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Embedding Model</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select embedding model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {embeddingModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Model used to embed documents and queries
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-3">
            <Dialog open={isTestQueryModalOpen} onOpenChange={setIsTestQueryModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="w-full"
                >
                  Test Query
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Test Query Results</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Documents retrieved for query: "How can we optimize operational expenses?"
                  </DialogDescription>
                </DialogHeader>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Document Title</TableHead>
                      <TableHead className="text-white">Snippet</TableHead>
                      <TableHead className="text-white text-right">Relevance Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retrievedDocs.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell className="max-w-lg">{doc.snippet}</TableCell>
                        <TableCell className="text-right">{doc.relevanceScore.toFixed(2)}</TableCell>
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

export default memo(RetrieverNodeProperties);
