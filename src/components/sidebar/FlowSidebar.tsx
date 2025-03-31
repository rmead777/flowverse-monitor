
import { useCallback, useState } from 'react';
import { 
  File, Pen, Code, Database, 
  MessageSquare, Terminal, Sparkles, 
  Globe, Settings, Workflow, 
  Search, Layers, ThumbsUp, BookOpen,
  ChevronDown
} from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useReactFlow } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import TemplateCard from './TemplateCard';
import NodeTypeItem from './NodeTypeItem';

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
  const [gettingStartedOpen, setGettingStartedOpen] = useState(true);

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

  return (
    <div className="w-48 bg-gray-950 border-r border-gray-800 overflow-y-auto h-full flex flex-col">
      <Collapsible 
        open={gettingStartedOpen} 
        onOpenChange={setGettingStartedOpen}
        className="border-b border-gray-800"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-sm font-semibold text-white">
          Getting Started
          <ChevronDown className={`h-4 w-4 transition-transform ${gettingStartedOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0">
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
        </CollapsibleContent>
      </Collapsible>

      <div className="p-4 flex-1">
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
    </div>
  );
};

export default FlowSidebar;
