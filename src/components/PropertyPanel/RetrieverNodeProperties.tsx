
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import NodeDetails from './NodeDetailsInline';

const formSchema = z.object({
  vectorStore: z.string().default('pinecone'),
  embeddingModel: z.string().default('openai'),
  topK: z.coerce.number().int().min(1).max(100).default(5),
  similarityThreshold: z.coerce.number().min(0).max(1).default(0.7),
  namespace: z.string().optional(),
  metadataFilter: z.string().optional()
});

type RetrieverNodePropertiesProps = {
  nodeData: any;
  onUpdateNode: (data: any) => void;
};

interface RetrievedDocument {
  title: string;
  text: string;
  similarity: number;
}

const RetrieverNodeProperties = ({ nodeData, onUpdateNode }: RetrieverNodePropertiesProps) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [retrievedDocs, setRetrievedDocs] = useState<RetrievedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vectorStore: nodeData.vectorStore || 'pinecone',
      embeddingModel: nodeData.embeddingModel || 'openai',
      topK: nodeData.topK || 5,
      similarityThreshold: nodeData.similarityThreshold || 0.7,
      namespace: nodeData.namespace || '',
      metadataFilter: nodeData.metadataFilter || ''
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      ...values
    };
    onUpdateNode(updatedData);
    toast({
      title: 'Retriever node properties updated',
      description: 'Retriever configuration has been updated.',
    });
  };

  const handleTestRetrieval = async () => {
    setIsLoading(true);
    
    // Mock data for demonstration purposes
    setTimeout(() => {
      const mockRetrievedDocs: RetrievedDocument[] = [
        {
          title: "Knowledge Base Introduction",
          text: "This document provides an overview of the vector database and how embeddings are stored for semantic retrieval.",
          similarity: 0.89
        },
        {
          title: "Embedding Models Comparison",
          text: "A detailed analysis of various embedding models including OpenAI, Cohere, and open-source alternatives.",
          similarity: 0.82
        },
        {
          title: "Retrieval Augmented Generation",
          text: "How to implement RAG systems that combine retrieval with generative models for improved accuracy.",
          similarity: 0.76
        },
        {
          title: "Vector Database Optimization",
          text: "Techniques for optimizing vector database performance including indexing and caching strategies.",
          similarity: 0.71
        },
        {
          title: "Chunking Strategies",
          text: "Best practices for document chunking to improve retrieval quality in question answering systems.",
          similarity: 0.68
        }
      ];
      
      setRetrievedDocs(mockRetrievedDocs);
      setIsTestModalOpen(true);
      setIsLoading(false);
      
      // Update metrics in the node after "testing"
      const updatedData = {
        ...nodeData,
        metrics: {
          ...nodeData.metrics,
          latency: 178, // mock latency in ms
          tasksProcessed: (nodeData.metrics?.tasksProcessed || 0) + 1,
          errorRate: 0.01
        }
      };
      onUpdateNode(updatedData);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-white mb-4">Retriever Node Properties</div>
      
      <NodeDetails 
        node={{ id: nodeData.id, data: nodeData }} 
        onMetricsUpdate={(updatedData) => onUpdateNode(updatedData)} 
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="vectorStore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vector Database</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select vector store" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="pinecone">Pinecone</SelectItem>
                    <SelectItem value="chroma">ChromaDB</SelectItem>
                    <SelectItem value="weaviate">Weaviate</SelectItem>
                    <SelectItem value="qdrant">Qdrant</SelectItem>
                    <SelectItem value="milvus">Milvus</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="openai">OpenAI Embeddings</SelectItem>
                    <SelectItem value="cohere">Cohere Embeddings</SelectItem>
                    <SelectItem value="sentence-transformers">Sentence Transformers</SelectItem>
                    <SelectItem value="e5-large">E5-large</SelectItem>
                    <SelectItem value="jina">Jina Embeddings</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="topK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top K Documents</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      max="100"
                      className="bg-gray-800 border-gray-700 text-white" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="similarityThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Similarity Threshold: {field.value}</FormLabel>
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
          </div>
          
          <FormField
            control={form.control}
            name="namespace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Namespace (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    className="bg-gray-800 border-gray-700 text-white" 
                    placeholder="Enter namespace"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="metadataFilter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metadata Filter (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    className="bg-gray-800 border-gray-700 text-white" 
                    placeholder="metadata.field:value"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
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
              onClick={handleTestRetrieval}
              disabled={isLoading}
            >
              {isLoading ? 'Testing...' : 'Test Retrieval'}
            </Button>
          </div>
        </form>
      </Form>
      
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Retrieved Documents</DialogTitle>
            <DialogDescription className="text-gray-400">
              Top {retrievedDocs.length} documents retrieved with {form.watch('embeddingModel')} embeddings
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-white">Title</TableHead>
                  <TableHead className="text-white">Content</TableHead>
                  <TableHead className="text-white text-right">Similarity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retrievedDocs.map((doc, idx) => (
                  <TableRow key={idx} className="border-gray-700">
                    <TableCell className="font-medium text-gray-300">{doc.title}</TableCell>
                    <TableCell className="text-gray-400">{doc.text}</TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={`font-mono ${
                          doc.similarity > 0.8 ? "text-green-400" : 
                          doc.similarity > 0.7 ? "text-yellow-400" : 
                          "text-gray-400"
                        }`}
                      >
                        {doc.similarity.toFixed(3)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-sm text-gray-400 mt-2">
            <p>Retrieval latency: <span className="font-mono">{nodeData.metrics?.latency || 0}ms</span></p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetrieverNodeProperties;
