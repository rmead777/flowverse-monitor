import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  useReactFlow,
  Panel,
  ConnectionLineType,
  MiniMapProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from './ui/button';
import CustomNode from './CustomNode';
import NodeDetails from './NodeDetails';
import { Save, Download, Upload, RotateCcw, Undo, Redo, Plus, Minus, Maximize, Loader, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import SaveFlowDialog from './SaveFlowDialog';
import { v4 as uuidv4 } from 'uuid';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

const initialNodes = [
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
        tasksProcessed: 126,
        errorRate: 0.02,
        latency: 12,
      },
    },
    position: { x: 250, y: 0 },
  },
  {
    id: '2',
    type: 'custom',
    data: { 
      label: 'Content Filter',
      status: 'active',
      type: 'action',
      actionType: 'transform',
      actionParams: '{"filter": "profanity", "level": "strict"}',
      metrics: {
        tasksProcessed: 126,
        errorRate: 0.01,
        latency: 8,
      },
    },
    position: { x: 100, y: 100 },
  },
  {
    id: '3',
    type: 'custom',
    data: { 
      label: 'GPT-4 Analysis',
      status: 'active',
      type: 'aiResponse',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1024,
      metrics: {
        tasksProcessed: 124,
        errorRate: 0.00,
        latency: 420,
      },
    },
    position: { x: 400, y: 100 },
  },
  {
    id: '4',
    type: 'custom',
    data: { 
      label: 'Action Generator',
      status: 'error',
      type: 'action',
      actionType: 'analyze',
      actionParams: '{"output": "suggestions", "format": "json"}',
      metrics: {
        tasksProcessed: 118,
        errorRate: 0.05,
        latency: 24,
      },
    },
    position: { x: 250, y: 200 },
  },
  {
    id: '5',
    type: 'custom',
    data: { 
      label: 'Response Formatter',
      status: 'idle',
      type: 'configuration',
      configType: 'outputFormat',
      configParams: '{"format": "markdown", "includeMetadata": true}',
      metrics: {
        tasksProcessed: 118,
        errorRate: 0.00,
        latency: 15,
      },
    },
    position: { x: 250, y: 300 },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e4-5', source: '4', target: '5', animated: true },
];

const nodeTypes = {
  custom: CustomNode,
};

const customMiniMapNodeColor = (node: Node) => {
  if (!node || !node.data) return '#d0c0f7';

  switch (node.data.type) {
    case 'systemPrompt':
      return 'rgba(126, 34, 206, 0.7)';
    case 'userInput':
    case 'input':
      return 'rgba(30, 64, 175, 0.7)';
    case 'aiResponse':
    case 'output':
      return 'rgba(6, 95, 70, 0.7)';
    case 'action':
      return 'rgba(194, 65, 12, 0.7)';
    case 'apiCall':
      return 'rgba(157, 23, 77, 0.7)';
    case 'configuration':
      return 'rgba(161, 98, 7, 0.7)';
    case 'process':
      return 'rgba(88, 28, 135, 0.7)';
    case 'ai':
      return 'rgba(67, 56, 202, 0.7)';
    default:
      return 'rgba(17, 24, 39, 0.7)';
  }
};

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type FlowConfigurationType = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: Json;
  edges: Json;
  created_at: string;
  updated_at: string;
}

type AgentMetricsType = {
  id: string;
  agent_id: string;
  task_count: number;
  error_count: number;
  latency: number;
  timestamp: string;
}

type AgentLogsType = {
  id: string;
  agent_name: string;
  event_type: string;
  details: Json;
  timestamp: string;
}

interface FlowViewProps {
  onNodeSelect?: (node: Node) => void;
  initialFlowData?: { nodes: Node[], edges: Edge[] };
}

const FlowView = ({ onNodeSelect, initialFlowData }: FlowViewProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowData?.nodes?.length ? initialFlowData.nodes : initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowData?.edges?.length ? initialFlowData.edges : initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flowConfigurations, setFlowConfigurations] = useState<FlowConfigurationType[]>([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const reactFlowInstance = useReactFlow();
  const flowWrapper = useRef(null);
  
  const ensureNodeProperties = useCallback((nodes: Node[]) => {
    return nodes.map(node => {
      const data = node.data || {};
      
      if (!data.type) {
        if (node.type === 'input' || data.inputType !== undefined) {
          data.type = 'userInput';
        } else if (node.type === 'output' || data.model !== undefined) {
          data.type = 'aiResponse';
        } else if (data.prompt !== undefined) {
          data.type = 'systemPrompt';
        } else if (data.actionType !== undefined) {
          data.type = 'action';
        } else if (data.endpoint !== undefined) {
          data.type = 'apiCall';
        } else if (data.configType !== undefined) {
          data.type = 'configuration';
        }
      }
      
      switch (data.type) {
        case 'userInput':
          if (!data.inputType) data.inputType = 'text';
          if (!data.preprocessing) data.preprocessing = 'none';
          break;
        case 'aiResponse':
          if (!data.model) data.model = 'gpt-4o';
          if (data.temperature === undefined) data.temperature = 0.7;
          if (!data.maxTokens) data.maxTokens = 1024;
          break;
        case 'systemPrompt':
          if (!data.prompt) data.prompt = '';
          break;
        case 'action':
          if (!data.actionType) data.actionType = 'transform';
          if (!data.actionParams) data.actionParams = '{}';
          break;
        case 'apiCall':
          if (!data.endpoint) data.endpoint = '';
          if (!data.method) data.method = 'GET';
          if (!data.headers) data.headers = '{}';
          break;
        case 'configuration':
          if (!data.configType) data.configType = 'outputFormat';
          if (!data.configParams) data.configParams = '{}';
          break;
      }
      
      if (!data.metrics) {
        data.metrics = {
          tasksProcessed: 0,
          errorRate: 0,
          latency: 0
        };
      }
      
      if (!data.status) {
        data.status = 'idle';
      }
      
      return {
        ...node,
        data
      };
    });
  }, []);
  
  useEffect(() => {
    if (initialFlowData?.nodes?.length) {
      setNodes(ensureNodeProperties(initialFlowData.nodes));
      setEdges(initialFlowData.edges);
    }
  }, [initialFlowData, setNodes, setEdges, ensureNodeProperties]);
  
  useEffect(() => {
    if (user) {
      fetchFlowConfigurations();
    }
  }, [user]);
  
  const fetchFlowConfigurations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('flow_configurations')
        .select('*')
        .order('updated_at', { ascending: false }) as { data: FlowConfigurationType[] | null; error: any };
        
      if (error) throw error;
      setFlowConfigurations(data || []);
    } catch (error) {
      console.error('Error fetching flow configurations:', error);
      toast({
        title: 'Error fetching saved flows',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onConnect = useCallback(
    (params) => {
      const newEdge = { ...params, id: `e${params.source}-${params.target}`, animated: true };
      setEdges((eds) => addEdge(newEdge, eds));
      saveToUndoHistory();
    },
    [setEdges]
  );

  const saveToUndoHistory = useCallback(() => {
    setUndoStack((stack) => [
      ...stack,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
    ]);
    setRedoStack([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastState = undoStack[undoStack.length - 1];
    setRedoStack((stack) => [
      ...stack,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
    ]);
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
    setUndoStack((stack) => stack.slice(0, -1));
  }, [undoStack, redoStack, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((stack) => [
      ...stack,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
    ]);
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setRedoStack((stack) => stack.slice(0, -1));
  }, [undoStack, redoStack, nodes, edges, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    const enhancedNode = ensureNodeProperties([node])[0];
    setSelectedNode(enhancedNode);
    if (onNodeSelect) {
      onNodeSelect(enhancedNode);
    }
  }, [onNodeSelect, ensureNodeProperties]);

  const closeNodeDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const resetView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const saveFlow = useCallback(async (name, description) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save flow configurations',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const flowData = {
        user_id: user.id,
        name,
        description,
        nodes: JSON.parse(JSON.stringify(nodes)) as Json,
        edges: JSON.parse(JSON.stringify(edges)) as Json,
      };
      
      const { error } = await supabase
        .from('flow_configurations')
        .insert([flowData]) as { error: any };
        
      if (error) throw error;
      
      toast({
        title: 'Flow saved successfully',
        description: `Flow "${name}" has been saved to your account`,
      });
      
      fetchFlowConfigurations();
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({
        title: 'Error saving flow',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsSaveDialogOpen(false);
    }
  }, [user, nodes, edges, toast]);

  const loadFlow = useCallback(async (id) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('flow_configurations')
        .select('*')
        .eq('id', id)
        .single() as { data: FlowConfigurationType | null; error: any };
        
      if (error) throw error;
      
      if (data) {
        saveToUndoHistory();
        setNodes(data.nodes as unknown as Node[]);
        setEdges(data.edges as unknown as Edge[]);
        
        toast({
          title: 'Flow loaded successfully',
          description: `Flow "${data.name}" has been loaded`,
        });
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      toast({
        title: 'Error loading flow',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges, toast, saveToUndoHistory]);

  const exportFlow = useCallback(() => {
    const flowData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };
    
    const jsonString = JSON.stringify(flowData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowverse-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Flow exported successfully',
      description: 'Your flow has been exported as a JSON file',
    });
  }, [nodes, edges, toast]);

  const importFlow = useCallback((event) => {
    const fileInput = event.target;
    const file = fileInput.files[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const importedData = JSON.parse(result);
            
            if (importedData.nodes && importedData.edges) {
              saveToUndoHistory();
              setNodes(importedData.nodes);
              setEdges(importedData.edges);
              
              toast({
                title: 'Flow imported successfully',
                description: 'Your flow has been imported from the JSON file',
              });
            } else {
              throw new Error('Invalid flow configuration format');
            }
          }
        } catch (error) {
          console.error('Error importing flow:', error);
          toast({
            title: 'Error importing flow',
            description: error.message,
            variant: 'destructive',
          });
        }
      };
      
      reader.readAsText(file);
    }
    
    fileInput.value = '';
  }, [setNodes, setEdges, toast, saveToUndoHistory]);

  const logNodeMetrics = useCallback(async (node) => {
    if (!node || !node.data) return;
    
    try {
      const { error } = await supabase
        .from('agent_metrics')
        .insert([{
          agent_id: node.id,
          task_count: node.data.metrics.tasksProcessed,
          error_count: Math.round(node.data.metrics.tasksProcessed * node.data.metrics.errorRate),
          latency: node.data.metrics.latency
        }]) as { error: any };
        
      if (error) throw error;
      
    } catch (error) {
      console.error('Error logging metrics:', error);
    }
  }, []);

  const addNode = useCallback(() => {
    const newNode = {
      id: uuidv4(),
      type: 'custom',
      position: { 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 400 + 50 
      },
      data: { 
        label: 'New Node',
        status: 'idle',
        type: 'process',
        metrics: {
          tasksProcessed: 0,
          errorRate: 0.0,
          latency: 0,
        },
      },
    };
    
    saveToUndoHistory();
    setNodes((nds) => [...nds, newNode]);
    
    const logOperation = async () => {
      try {
        const { error } = await supabase
          .from('agent_logs')
          .insert([{
            agent_name: newNode.data.label,
            event_type: 'node_created',
            details: { 
              node_id: newNode.id,
              node_type: newNode.data.type
            } as Json
          }]);
          
        if (error) console.error('Error logging node creation:', error);
      } catch (err) {
        console.error('Error logging node creation:', err);
      }
    };
    
    logOperation();
  }, [setNodes, saveToUndoHistory]);

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) return;
    
    saveToUndoHistory();
    
    const nodeIdsToDelete = selectedNodes.map(node => node.id);
    
    setNodes(nodes => nodes.filter(node => !nodeIdsToDelete.includes(node.id)));
    
    setEdges(edges => edges.filter(edge => 
      !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)
    ));
    
    toast({
      title: `${nodeIdsToDelete.length} node${nodeIdsToDelete.length > 1 ? 's' : ''} deleted`,
      description: `Successfully removed ${nodeIdsToDelete.length} node${nodeIdsToDelete.length > 1 ? 's' : ''} from the flow`,
    });
    
    const logDeletion = async () => {
      try {
        if (!user) return;
        
        await supabase
          .from('agent_logs')
          .insert(nodeIdsToDelete.map(nodeId => ({
            agent_name: nodes.find(n => n.id === nodeId)?.data?.label || 'Unknown Node',
            event_type: 'node_deleted',
            details: { node_id: nodeId }
          })));
      } catch (err) {
        console.error('Error logging node deletion:', err);
      }
    };
    
    logDeletion();
  }, [nodes, setNodes, setEdges, saveToUndoHistory, toast, user]);

  const deleteNode = useCallback((nodeId) => {
    saveToUndoHistory();
    
    setNodes(nodes => nodes.filter(node => node.id !== nodeId));
    
    setEdges(edges => edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    toast({
      title: "Node deleted",
      description: "Successfully removed the node from the flow",
    });
    
    const logDeletion = async () => {
      try {
        if (!user) return;
        
        const nodeName = nodes.find(n => n.id === nodeId)?.data?.label || 'Unknown Node';
        
        await supabase
          .from('agent_logs')
          .insert([{
            agent_name: nodeName,
            event_type: 'node_deleted',
            details: { node_id: nodeId }
          }]);
      } catch (err) {
        console.error('Error logging node deletion:', err);
      }
    };
    
    logDeletion();
  }, [nodes, setNodes, setEdges, saveToUndoHistory, toast, user]);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    const isInput = activeElement?.tagName === 'INPUT' || 
                    activeElement?.tagName === 'TEXTAREA' || 
                    activeElement?.getAttribute('contenteditable') === 'true';
    
    if (!isInput && (event.key === 'Delete' || event.key === 'Backspace')) {
      deleteSelectedNodes();
    }
  }, [deleteSelectedNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = flowWrapper.current.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeData) return;
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const newNode = JSON.parse(nodeData);
      newNode.position = position;
      
      saveToUndoHistory();
      setNodes((nds) => [...nds, newNode]);

      const logOperation = async () => {
        try {
          const { error } = await supabase
            .from('agent_logs')
            .insert([{
              agent_name: newNode.data.label,
              event_type: 'node_created',
              details: { 
                node_id: newNode.id,
                node_type: newNode.data.type
              } as Json
            }]);
            
          if (error) console.error('Error logging node creation:', error);
        } catch (err) {
          console.error('Error logging node creation:', err);
        }
      };
      
      logOperation();
    },
    [reactFlowInstance, setNodes, saveToUndoHistory]
  );

  return (
    <div 
      className="w-full h-full relative" 
      ref={flowWrapper}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
          onClick={zoomIn}
          aria-label="Zoom In"
        >
          <Plus className="h-4 w-4" />
          Zoom In
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
          onClick={zoomOut}
          aria-label="Zoom Out"
        >
          <Minus className="h-4 w-4" />
          Zoom Out
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
          onClick={resetView}
          aria-label="Reset View"
        >
          <Maximize className="h-4 w-4" />
          Reset View
        </Button>
      </div>
      <div style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
        <ContextMenu>
          <ContextMenuTrigger>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              onDragOver={onDragOver}
              onDrop={onDrop}
              fitView
            >
              <Controls />
              <MiniMap 
                nodeColor={customMiniMapNodeColor}
                maskColor="rgba(240, 240, 240, 0.3)" 
                className="bg-opacity-60 bg-gray-950 rounded-lg" 
              />
              <Background />
              
              <Panel position="top-left" className="bg-gray-800 p-2 rounded-md shadow-md flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                  onClick={() => setIsSaveDialogOpen(true)}
                  disabled={isLoading || !user}
                  aria-label="Save Flow"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                  onClick={exportFlow}
                  aria-label="Export Flow"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <label className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                    onClick={() => document.getElementById('file-input').click()}
                    aria-label="Import Flow"
                  >
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".json"
                    onChange={importFlow}
                    className="hidden"
                  />
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                  onClick={addNode}
                  aria-label="Add Node"
                >
                  <Plus className="h-4 w-4" />
                  Add Node
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                  onClick={deleteSelectedNodes}
                  aria-label="Delete Selected"
                  disabled={!nodes.some(node => node.selected)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </Panel>
              
              <Panel position="bottom-left" className="bg-gray-800 p-2 rounded-md shadow-md flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  aria-label="Undo"
                >
                  <Undo className="h-4 w-4" />
                  Undo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 bg-white hover:bg-gray-100 text-black border-gray-300"
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  aria-label="Redo"
                >
                  <Redo className="h-4 w-4" />
                  Redo
                </Button>
              </Panel>
            </ReactFlow>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                const selectedNode = nodes.find(node => node.selected);
                if (selectedNode) {
                  deleteNode(selectedNode.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Node
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      
      {selectedNode && !onNodeSelect && (
        <NodeDetails 
          node={selectedNode} 
          onClose={closeNodeDetails}
          onMetricsUpdate={() => logNodeMetrics(selectedNode)}
        />
      )}
      
      {isSaveDialogOpen && (
        <SaveFlowDialog
          isOpen={isSaveDialogOpen}
          onClose={() => setIsSaveDialogOpen(false)}
          onSave={saveFlow}
          isLoading={isLoading}
          existingFlows={flowConfigurations}
        />
      )}
    </div>
  );
};

export default FlowView;
