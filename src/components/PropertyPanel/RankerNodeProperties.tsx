
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  rankingModel: z.string().default('cross-encoder/ms-marco-MiniLM-L-6-v2'),
  topN: z.coerce.number().int().min(1).max(100).default(5)
});

type RankerNodeProps = {
  nodeData: any;
  onUpdateNode: (data: any) => void;
};

interface RerankedDocument {
  title: string;
  snippet: string;
  score: number;
}

const RankerNodeProperties = ({ nodeData, onUpdateNode }: RankerNodeProps) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [rerankedDocs, setRerankedDocs] = useState<RerankedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rankingModel: nodeData.rankingModel || 'cross-encoder/ms-marco-MiniLM-L-6-v2',
      topN: nodeData.topN || 5
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      rankingModel: values.rankingModel,
      topN: values.topN
    };
    onUpdateNode(updatedData);
    toast({
      title: 'Node properties updated',
      description: 'Ranker node configuration has been updated.',
    });
  };

  const handleTestRanking = async () => {
    setIsLoading(true);
    
    // Mock data for demonstration purposes
    setTimeout(() => {
      const mockRerankedDocs: RerankedDocument[] = [
        {
          title: "Understanding Cross-Encoders",
          snippet: "Cross-encoders process query and document together, providing accurate relevance scores but at a higher computational cost.",
          score: 0.921
        },
        {
          title: "Improving RAG Systems",
          snippet: "Re-ranking is a crucial step in modern RAG pipelines to improve the relevance of retrieved documents before generation.",
          score: 0.876
        },
        {
          title: "Bi-Encoders vs Cross-Encoders",
          snippet: "Bi-encoders compute embeddings separately, while cross-encoders process pairs together for more accurate relevance scoring.",
          score: 0.835
        },
        {
          title: "Vector Search Limitations",
          snippet: "While vector search is fast, it may miss semantic relevance that cross-encoder re-ranking can later capture.",
          score: 0.784
        },
        {
          title: "Implementing Efficient Re-ranking",
          snippet: "Two-stage retrieval with initial vector search followed by re-ranking balances efficiency and relevance.",
          score: 0.712
        }
      ];
      
      setRerankedDocs(mockRerankedDocs);
      setIsTestModalOpen(true);
      setIsLoading(false);
      
      // Update metrics in the node after "testing"
      const updatedData = {
        ...nodeData,
        metrics: {
          ...nodeData.metrics,
          rerankingLatency: 235, // mock latency in ms
          relevanceImprovement: 0.28 // mock improvement by 28%
        }
      };
      onUpdateNode(updatedData);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-white mb-4">Ranker Node Properties</div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="rankingModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ranking Model</FormLabel>
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
                    <SelectItem value="cross-encoder/ms-marco-MiniLM-L-6-v2">
                      MS MARCO MiniLM-L-6-v2
                    </SelectItem>
                    <SelectItem value="cross-encoder/ms-marco-MiniLM-L-12-v2">
                      MS MARCO MiniLM-L-12-v2
                    </SelectItem>
                    <SelectItem value="pinecone/reranker-v1">
                      Pinecone Reranker v1
                    </SelectItem>
                    <SelectItem value="cross-encoder/stsb-roberta-base">
                      STSb RoBERTa Base
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="topN"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top N Documents</FormLabel>
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
          
          <div className="flex flex-col space-y-2 pt-2">
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="border-gray-700 text-white hover:bg-gray-700"
              onClick={handleTestRanking}
              disabled={isLoading}
            >
              {isLoading ? 'Testing...' : 'Test Ranking'}
            </Button>
          </div>
        </form>
      </Form>
      
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Re-Ranked Results</DialogTitle>
            <DialogDescription className="text-gray-400">
              Top {rerankedDocs.length} documents after re-ranking with {form.watch('rankingModel')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-white">Title</TableHead>
                  <TableHead className="text-white">Snippet</TableHead>
                  <TableHead className="text-white text-right">Relevance Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rerankedDocs.map((doc, idx) => (
                  <TableRow key={idx} className="border-gray-700">
                    <TableCell className="font-medium text-gray-300">{doc.title}</TableCell>
                    <TableCell className="text-gray-400">{doc.snippet}</TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={`font-mono ${
                          doc.score > 0.8 ? "text-green-400" : 
                          doc.score > 0.6 ? "text-yellow-400" : 
                          "text-gray-400"
                        }`}
                      >
                        {doc.score.toFixed(3)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-sm text-gray-400 mt-2">
            <p>Re-ranking latency: <span className="font-mono">{nodeData.metrics?.rerankingLatency || 0}ms</span></p>
            <p>Relevance improvement: <span className="font-mono">{((nodeData.metrics?.relevanceImprovement || 0) * 100).toFixed(1)}%</span></p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RankerNodeProperties;
