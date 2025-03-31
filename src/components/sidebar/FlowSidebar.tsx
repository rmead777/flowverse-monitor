import { useCallback, useState } from 'react';
import { 
  File, Pen, Code, Database, 
  MessageSquare, Terminal, Sparkles, 
  Globe, Settings, Workflow, 
  Search, Layers, ThumbsUp, 
  BookOpen, BarChart2, FileText
} from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useReactFlow } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import TemplateCard from './TemplateCard';
import NodeTypeItem from './NodeTypeItem';
import KnowledgeBaseItem from './KnowledgeBaseItem';

const templates = [
  {
    id: 'blank',
    title: 'Blank Flow',
    description: 'Start with a clean canvas to build your own flow from scratch.',
    icon: <File className="h-5 w-5" />
  },
  {
    id: 'creative',
    title: 'Creative Write',
    description: 'Pre-configured flow for creative writing and content generation.',
    icon: <Pen className="h-5 w-5" />
  },
  {
    id: 'code',
    title: 'Code Assistant',
    description: 'Helps with coding tasks, debugging, and code explanations.',
    icon: <Code className="h-5 w-5" />
  },
  {
    id: 'data',
    title: 'Data Analyst',
    description: 'Analyze and visualize data with specialized processing nodes.',
    icon: <Database className="h-5 w-5" />
  },
  {
    id: 'rag',
    title: 'RAG System',
    description: 'Retrieval-Augmented Generation for knowledge-based responses.',
    icon: <BookOpen className="h-5 w-5" />
  }
];

const nodeTypes = [
  {
    category: 'Input/Output',
    items: [
      {
        type: 'systemPrompt',
        title: 'System Prompt',
        description: 'Defines AI behavior and sets the context for the interaction.',
        icon: <Terminal className="h-5 w-5" />,
        color: '#a78bfa' // Purple
      },
      {
        type: 'userInput',
        title: 'User Input',
        description: 'Processes user messages and passes them to the next node.',
        icon: <MessageSquare className="h-5 w-5" />,
        color: '#60a5fa' // Blue
      },
      {
        type: 'aiResponse',
        title: 'AI Response',
        description: 'Generates AI reply based on the previous nodes.',
        icon: <Sparkles className="h-5 w-5" />,
        color: '#4ade80' // Green
      }
    ]
  },
  {
    category: 'RAG Components',
    items: [
      {
        type: 'retriever',
        title: 'Retriever',
        description: 'Fetches relevant documents from knowledge bases.',
        icon: <Search className="h-5 w-5" />,
        color: '#60a5fa' // Blue
      },
      {
        type: 'contextManager',
        title: 'Context Manager',
        description: 'Manages conversation context and history.',
        icon: <Layers className="h-5 w-5" />,
        color: '#fbbf24' // Yellow
      },
      {
        type: 'feedback',
        title: 'Feedback',
        description: 'Collects and processes user feedback on responses.',
        icon: <ThumbsUp className="h-5 w-5" />,
        color: '#4ade80' // Green
      }
    ]
  },
  {
    category: 'Actions',
    items: [
      {
        type: 'action',
        title: 'Action',
        description: 'Performs a specific task like text processing or transformation.',
        icon: <Workflow className="h-5 w-5" />,
        color: '#f97316' // Orange
      },
      {
        type: 'apiCall',
        title: 'API Call',
        description: 'Connects to external services and APIs to fetch or send data.',
        icon: <Globe className="h-5 w-5" />,
        color: '#f43f5e' // Pink
      }
    ]
  },
  {
    category: 'Configuration',
    items: [
      {
        type: 'configuration',
        title: 'Configuration',
        description: 'Adjusts model parameters and flow settings.',
        icon: <Settings className="h-5 w-5" />,
        color: '#fbbf24' // Yellow
      }
    ]
  }
];

const knowledgeBases = [
  {
    id: '1',
    name: 'Technical Documentation',
    type: 'Pinecone',
    status: 'active',
    documentCount: 248,
    lastUpdated: '2023-06-10'
  },
  {
    id: '2',
    name: 'Product Manuals',
    type: 'Weaviate',
    status: 'active',
    documentCount: 112,
    lastUpdated: '2023-07-01'
  },
  {
    id: '3',
    name: 'Customer Support',
    type: 'Supabase',
    status: 'indexing',
    documentCount: 503,
    lastUpdated: '2023-07-12'
  }
];

const templateFlows = {
  blank: {
    nodes: [],
    edges: []
  },
  creative: {
    nodes: [
      {
        id: '1',
        type: 'custom',
        data: { 
          label: 'User Input',
          status: 'active',
          type: 'input',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 50 },
      },
      {
        id: '2',
        type: 'custom',
        data: { 
          label: 'Creative Style',
          status: 'active',
          type: 'process',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 150 },
      },
      {
        id: '3',
        type: 'custom',
        data: { 
          label: 'AI Writer',
          status: 'active',
          type: 'ai',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 250 },
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3', animated: true }
    ]
  },
  code: {
    nodes: [
      {
        id: '1',
        type: 'custom',
        data: { 
          label: 'Code Input',
          status: 'active',
          type: 'input',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 50 },
      },
      {
        id: '2',
        type: 'custom',
        data: { 
          label: 'Syntax Analysis',
          status: 'active',
          type: 'process',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 150, y: 150 },
      },
      {
        id: '3',
        type: 'custom',
        data: { 
          label: 'Documentation',
          status: 'active',
          type: 'process',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 350, y: 150 },
      },
      {
        id: '4',
        type: 'custom',
        data: { 
          label: 'AI Code Assistant',
          status: 'active',
          type: 'ai',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 250 },
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e1-3', source: '1', target: '3', animated: true },
      { id: 'e2-4', source: '2', target: '4', animated: true },
      { id: 'e3-4', source: '3', target: '4', animated: true }
    ]
  },
  data: {
    nodes: [
      {
        id: '1',
        type: 'custom',
        data: { 
          label: 'Data Input',
          status: 'active',
          type: 'input',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 50 },
      },
      {
        id: '2',
        type: 'custom',
        data: { 
          label: 'Data Cleaning',
          status: 'active',
          type: 'process',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 150 },
      },
      {
        id: '3',
        type: 'custom',
        data: { 
          label: 'Analysis',
          status: 'active',
          type: 'process',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 150, y: 250 },
      },
      {
        id: '4',
        type: 'custom',
        data: { 
          label: 'Visualization',
          status: 'active',
          type: 'process',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 350, y: 250 },
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3', animated: true },
      { id: 'e2-4', source: '2', target: '4', animated: true }
    ]
  },
  rag: {
    nodes: [
      {
        id: '1',
        type: 'custom',
        data: { 
          label: 'User Input',
          status: 'active',
          type: 'userInput',
          inputType: 'text',
          preprocessing: 'none',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 50 },
      },
      {
        id: '2',
        type: 'custom',
        data: { 
          label: 'Context Manager',
          status: 'active',
          type: 'contextManager',
          contextWindow: 5,
          contextStorage: 'in-memory',
          contextFormat: 'prepend',
          metrics: {
            tasksProcessed: 0,
            errorRate: 0.0,
            latency: 0,
          },
        },
        position: { x: 250, y: 150 },
      },
      {
        id: '3',
        type: 'custom',
        data: { 
          label: 'Retriever',
          status: 'active',
          type: 'retriever',
          knowledgeBase: 'Technical Documentation',
          numResults: 5,
          similarityThreshold: 0.8,
          embeddingModel: 'text-embedding-ada-002',
          metrics: {
            recallRate: 0.85,
            precision: 0.90,
            retrievalLatency: 350,
          },
        },
        position: { x: 100, y: 250 },
      },
      {
        id: '4',
        type: 'custom',
        data: { 
          label: 'AI Response',
          status: 'active',
          type: 'aiResponse',
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 1024,
          metrics: {
            responseRelevance: 0.92,
            responseLength: 425,
            generationLatency: 890,
          },
        },
        position: { x: 250, y: 350 },
      },
      {
        id: '5',
        type: 'custom',
        data: { 
          label: 'Feedback Collector',
          status: 'active',
          type: 'feedback',
          feedbackType: 'thumbsUpDown',
          storeFeedback: true,
          metrics: {
            feedbackCount: 0,
            averageRating: 0,
            positivePercentage: 0,
          },
        },
        position: { x: 250, y: 450 },
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e2-3', source: '2', target: '3', animated: true },
      { id: 'e2-4', source: '2', target: '4', animated: true },
      { id: 'e3-4', source: '3', target: '4', animated: true },
      { id: 'e4-5', source: '4', target: '5', animated: true }
    ]
  }
};

interface FlowSidebarProps {
  onSelectTemplate: (nodes: any[], edges: any[]) => void;
}

const FlowSidebar = ({ onSelectTemplate }: FlowSidebarProps) => {
  const { setNodes } = useReactFlow();
  const [showAddKbDialog, setShowAddKbDialog] = useState(false);
  const [showKbDetailsDialog, setShowKbDetailsDialog] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(null);
  const [newKbData, setNewKbData] = useState({
    name: '',
    type: 'pinecone',
    apiKey: '',
    environment: '',
    namespace: ''
  });

  const handleTemplateSelect = useCallback((templateId: string) => {
    const templateData = templateFlows[templateId];
    if (templateData) {
      onSelectTemplate(templateData.nodes, templateData.edges);
      
      toast({
        title: `${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Template Loaded`,
        description: templateId === 'blank' 
          ? 'Starting with a blank canvas' 
          : 'Template loaded successfully. Try adding more nodes!'
      });
      
      if (!localStorage.getItem('flow-tour-shown')) {
        localStorage.setItem('flow-tour-shown', 'true');
        setTimeout(() => {
          toast({
            title: 'Getting Started Tip',
            description: 'Drag a node from the Node Types section to start building your flow.',
            duration: 5000
          });
        }, 1000);
      }
    }
  }, [onSelectTemplate]);

  const handleNodeDragStart = useCallback((event: React.DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'custom',
      id: `${nodeType}-${uuidv4().substring(0, 8)}`,
      data: { 
        label: nodeData.title,
        status: 'idle',
        type: nodeType,
        metrics: getDefaultMetricsForNodeType(nodeType),
      }
    }));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const getDefaultMetricsForNodeType = (nodeType: string) => {
    switch (nodeType) {
      case 'retriever':
        return {
          recallRate: 0.0,
          precision: 0.0,
          retrievalLatency: 0,
        };
      case 'aiResponse':
        return {
          responseRelevance: 0.0,
          responseLength: 0,
          generationLatency: 0,
        };
      case 'feedback':
        return {
          feedbackCount: 0,
          averageRating: 0,
          positivePercentage: 0,
        };
      case 'contextManager':
        return {
          contextSize: 0,
          messageCount: 0,
          processingTime: 0,
        };
      default:
        return {
          tasksProcessed: 0,
          errorRate: 0.0,
          latency: 0,
        };
    }
  };

  const handleAddKnowledgeBase = () => {
    toast({
      title: 'Knowledge Base Added',
      description: `"${newKbData.name}" has been successfully added.`
    });
    setShowAddKbDialog(false);
    setNewKbData({
      name: '',
      type: 'pinecone',
      apiKey: '',
      environment: '',
      namespace: ''
    });
  };

  const handleViewKnowledgeBase = (kb: any) => {
    setSelectedKnowledgeBase(kb);
    setShowKbDetailsDialog(true);
  };

  const getDynamicKbFields = () => {
    switch (newKbData.type) {
      case 'pinecone':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Input 
                id="environment" 
                value={newKbData.environment}
                onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace">Namespace (optional)</Label>
              <Input 
                id="namespace" 
                value={newKbData.namespace}
                onChange={(e) => setNewKbData({...newKbData, namespace: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </>
        );
      case 'weaviate':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">Weaviate URL</Label>
            <Input 
              id="url" 
              value={newKbData.environment}
              onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="https://instance.weaviate.network"
            />
          </div>
        );
      case 'supabase':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">Project URL</Label>
            <Input 
              id="url" 
              value={newKbData.environment}
              onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="https://project.supabase.co"
            />
          </div>
        );
      case 'google':
        return (
          <div className="space-y-2">
            <Label htmlFor="customSearch">Search Engine ID</Label>
            <Input 
              id="customSearch" 
              value={newKbData.environment}
              onChange={(e) => setNewKbData({...newKbData, environment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-48 bg-gray-950 border-r border-gray-800 overflow-y-auto h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white mb-3">Getting Started</h2>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              title={template.title}
              description={template.description}
              icon={template.icon}
              onClick={() => handleTemplateSelect(template.id)}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-800 flex-1">
        <h2 className="text-sm font-semibold text-white mb-3">Node Types</h2>
        <div className="space-y-4">
          {nodeTypes.map((category) => (
            <Collapsible key={category.category} defaultOpen={true}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-xs font-medium text-gray-400 hover:text-white">
                {category.category}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {category.items.map((node) => (
                  <NodeTypeItem
                    key={node.type}
                    title={node.title}
                    description={node.description}
                    icon={node.icon}
                    color={node.color}
                    onDragStart={(event) => handleNodeDragStart(event, node.type, node)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Knowledge Bases</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white"
            onClick={() => setShowAddKbDialog(true)}
          >
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {knowledgeBases.map((kb) => (
            <KnowledgeBaseItem
              key={kb.id}
              name={kb.name}
              type={kb.type}
              status={kb.status}
              onClick={() => handleViewKnowledgeBase(kb)}
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Views</h2>
        <div className="space-y-2">
          <button className="flex items-center space-x-2 w-full p-2 text-left text-sm rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <BarChart2 className="h-4 w-4" />
            <span>Metrics Dashboard</span>
          </button>
          <button className="flex items-center space-x-2 w-full p-2 text-left text-sm rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <ThumbsUp className="h-4 w-4" />
            <span>Feedback Analysis</span>
          </button>
          <button className="flex items-center space-x-2 w-full p-2 text-left text-sm rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
            <FileText className="h-4 w-4" />
            <span>Logs</span>
          </button>
        </div>
      </div>

      <Dialog open={showAddKbDialog} onOpenChange={setShowAddKbDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={newKbData.name}
                onChange={(e) => setNewKbData({...newKbData, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={newKbData.type} 
                onValueChange={(value) => setNewKbData({...newKbData, type: value})}
              >
                <SelectTrigger id="type" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="pinecone">Pinecone</SelectItem>
                  <SelectItem value="weaviate">Weaviate</SelectItem>
                  <SelectItem value="supabase">Supabase</SelectItem>
                  <SelectItem value="google">Google Search API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input 
                id="apiKey" 
                type="password"
                value={newKbData.apiKey}
                onChange={(e) => setNewKbData({...newKbData, apiKey: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            {getDynamicKbFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKbDialog(false)} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleAddKnowledgeBase} className="bg-indigo-600 hover:bg-indigo-700">
              Add Knowledge Base
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedKnowledgeBase && (
        <Dialog open={showKbDetailsDialog} onOpenChange={setShowKbDetailsDialog}>
          <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{selectedKnowledgeBase.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Type</span>
                  <p className="text-white">{selectedKnowledgeBase.type}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Status</span>
                  <p className="text-white capitalize">{selectedKnowledgeBase.status}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Documents</span>
                  <p className="text-white">{selectedKnowledgeBase.documentCount}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400 text-xs">Last Updated</span>
                  <p className="text-white">{selectedKnowledgeBase.lastUpdated}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-semibold mb-2">Documents</h3>
                <div className="border-2 border-dashed border-gray-700 p-6 rounded-md text-center">
                  <p className="text-gray-400">Drag and drop PDFs or text files here</p>
                  <p className="text-gray-500 text-xs mt-1">or</p>
                  <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700">Upload Files</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKbDetailsDialog(false)} className="border-gray-700 text-gray-300">
                Close
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FlowSidebar;
