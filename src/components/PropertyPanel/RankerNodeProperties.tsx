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

interface RankerNodePropertiesProps {
  nodeData: any;
  onUpdateNode: (updatedData: any) => void;
}

const rankingModels = [
  { id: 'cross-encoder/ms-marco-MiniLM-L-6-v2', name: 'cross-encoder/ms-marco-MiniLM-L-6-v2' },
  { id: 'cross-encoder/ms-marco-MiniLM-L-12-v2', name: 'cross-encoder/ms-marco-MiniLM-L-12-v2' },
];

const RankerNodeProperties = ({ nodeData, onUpdateNode }: RankerNodePropertiesProps) => {
  const [isTestRankingModalOpen, setIsTestRankingModalOpen] = useState(false);
  
  const rankedDocs = [
    { 
      title: 'Operational Efficiency Analysis', 
      snippet: 'The new automated workflow resulted in a 15% increase in productivity across departments...', 
      beforeScore: 0.82, 
      afterScore: 0.95 
    },
    { 
      title: 'Q4 Financial Report 2023', 
      snippet: 'Operating expenses decreased by 12% compared to Q3, primarily due to the implementation of...', 
      beforeScore: 0.92, 
      afterScore: 0.89 
    },
    { 
      title: 'Annual Budget Projection 2024', 
      snippet: 'Based on current trends, we project a 7% increase in revenue and a 3% decrease in costs...', 
      beforeScore: 0.81, 
      afterScore: 0.85 
    },
  ];

  const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    rankingModel: z.string(),
    numDocsToKeep: z.number().min(1).max(10),
    rerankingLatencyThreshold: z.number().min(50).max(500),
  });

  const defaultValues = {
    label: nodeData.label || 'Ranker',
    rankingModel: nodeData.rankingModel || 'cross-encoder/ms-marco-MiniLM-L-6-v2',
    numDocsToKeep: nodeData.numDocsToKeep || 5,
    rerankingLatencyThreshold: nodeData.rerankingLatencyThreshold || 200,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const updatedData = {
      ...nodeData,
      label: values.label,
      rankingModel: values.rankingModel,
      numDocsToKeep: values.numDocsToKeep,
      rerankingLatencyThreshold: values.rerankingLatencyThreshold,
    };
    onUpdateNode(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-white mb-4">Ranker Properties</div>
      
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
                      <SelectValue placeholder="Select ranking model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {rankingModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400">
                  Model used to rerank retrieved documents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="numDocsToKeep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documents to Keep: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="py-4"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Number of top documents to keep after reranking (1-10)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rerankingLatencyThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reranking Latency Threshold: {field.value}ms</FormLabel>
                <FormControl>
                  <Slider
                    min={50}
                    max={500}
                    step={10}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="py-4"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Maximum acceptable latency for reranking (50-500ms)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-3">
            <Dialog open={isTestRankingModalOpen} onOpenChange={setIsTestRankingModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="w-full"
                >
                  Test Ranking
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Test Ranking Results</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Documents ranked for query: "How can we optimize operational expenses?"
                  </DialogDescription>
                </DialogHeader>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Document Title</TableHead>
                      <TableHead className="text-white">Snippet</TableHead>
                      <TableHead className="text-white text-right">Before Score</TableHead>
                      <TableHead className="text-white text-right">After Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedDocs.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell className="max-w-md">{doc.snippet}</TableCell>
                        <TableCell className="text-right">{doc.beforeScore.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {doc.afterScore.toFixed(2)}
                        </TableCell>
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

export default memo(RankerNodeProperties);
