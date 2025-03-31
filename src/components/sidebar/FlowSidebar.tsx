
import { useCallback } from 'react';
import { 
  File, Pen, Code, Database, 
  MessageSquare, Terminal, Sparkles, 
  ApiIcon, Settings, Workflow 
} from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import TemplateCard from './TemplateCard';
import NodeTypeItem from './NodeTypeItem';
import { useReactFlow } from 'reactflow';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Template definitions
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
  }
];

// Node type definitions
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
        icon: <ApiIcon className="h-5 w-5" />,
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

// Template flow examples
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
  }
};

interface FlowSidebarProps {
  onSelectTemplate: (nodes: any[], edges: any[]) => void;
}

const FlowSidebar = ({ onSelectTemplate }: FlowSidebarProps) => {
  const { setNodes } = useReactFlow();

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
      
      // First time user tip
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
    // Set the drag data with the node information
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'custom',
      id: `${nodeType}-${uuidv4().substring(0, 8)}`,
      data: { 
        label: nodeData.title,
        status: 'idle',
        type: nodeType,
        metrics: {
          tasksProcessed: 0,
          errorRate: 0.0,
          latency: 0,
        },
      }
    }));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="w-48 bg-gray-950 border-r border-gray-800 overflow-y-auto h-full flex flex-col">
      {/* Getting Started Section */}
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

      {/* Node Types Section */}
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
