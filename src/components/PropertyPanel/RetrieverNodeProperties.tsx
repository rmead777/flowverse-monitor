
import { memo, useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getKnowledgeBases, vectorSearch } from '@/services/knowledgeBaseService';
import { Loader2 } from 'lucide-react';

interface RetrieverNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const embeddingModels = [
  { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002' },
  { id: 'voyage-finance-2', name: 'Voyage Finance 2' },
  { id: 'voyage-3-large', name: 'Voyage 3 Large' },
  { id: 'sentence-transformers', name: 'Sentence Transformers' },
];

const RetrieverNodeProperties = ({ nodeData, onUpdateNode }: RetrieverNodePropertiesProps) => {
  const { toast } = useToast();
  const [isTestQueryModalOpen, setIsTestQueryModalOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('How can we optimize operational expenses?');
  const [retrievedDocs, setRetrievedDocs] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Fetch knowledge bases
  const { data: knowledgeBases, isLoading: isLoadingKnowledgeBases } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: getKnowledgeBases
  });

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
    knowledgeBase: nodeData.knowledgeBase || '',
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

  const handleTestQuery = async () => {
    if (!testQuery.trim() || !form.getValues().knowledgeBase) {
      toast({
        title: 'Missing information',
        description: 'Please enter a query and select a knowledge base',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearching(true);
      const knowledgeBaseId = form.getValues().knowledgeBase;
      const limit = form.getValues().numResults;
      const similarityThreshold = form.getValues().similarityThreshold;
      
      // Parse filters if any
      let filters = {};
      const filtersText = form.getValues().filters;
      if (filtersText && filtersText.trim() !== '') {
        try {
          // Simple parsing for format like "metadata.year >= 2023"
          const parts = filtersText.split(/\s*(>=|<=|==|=|>|<)\s*/);
          if (parts.length >= 3) {
            const key = parts[0].trim();
            const value = isNaN(Number(parts[2])) ? parts[2].trim() : Number(parts[2]);
            filters = { [key]: value };
          }
        } catch (error) {
          console.error('Error parsing filters:', error);
        }
      }

      const result = await vectorSearch(
        knowledgeBaseId,
        testQuery,
        limit,
        similarityThreshold,
        filters
      );

      setRetrievedDocs(result.results || []);
      setIsTestQueryModalOpen(true);
    } catch (error) {
      toast({
        title: 'Error performing search',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select knowledge base" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {isLoadingKnowledgeBases ? (
                      <SelectItem value="loading" disabled>Loading knowledge bases...</SelectItem>
                    ) : knowledgeBases && knowledgeBases.length > 0 ? (
                      knowledgeBases.map(kb => (
                        <SelectItem key={kb.id} value={kb.id}>
                          {kb.name} ({kb.type})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No knowledge bases found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Select a knowledge base for document retrieval
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
                  value={field.value}
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
          
          <div className="space-y-2 pt-3">
            <Label>Test Query</Label>
            <div className="flex gap-2">
              <Input 
                className="flex-1 bg-gray-800 border-gray-700 text-white"
                placeholder="Enter a test query..."
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
              />
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleTestQuery}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Search
              </Button>
            </div>
          </div>
          
          <Dialog open={isTestQueryModalOpen} onOpenChange={setIsTestQueryModalOpen}>
            <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Test Query Results</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Documents retrieved for query: "{testQuery}"
                </DialogDescription>
              </DialogHeader>
              
              {retrievedDocs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Document</TableHead>
                      <TableHead className="text-white">Content</TableHead>
                      <TableHead className="text-white text-right">Relevance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retrievedDocs.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {doc.document?.filename || 'Unknown document'}
                        </TableCell>
                        <TableCell className="max-w-lg">
                          {doc.content.length > 200 
                            ? `${doc.content.substring(0, 200)}...` 
                            : doc.content}
                        </TableCell>
                        <TableCell className="text-right">
                          {typeof doc.similarity === 'number' 
                            ? doc.similarity.toFixed(2) 
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No results found for your query.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </form>
      </Form>
    </div>
  );
};

export default memo(RetrieverNodeProperties);
