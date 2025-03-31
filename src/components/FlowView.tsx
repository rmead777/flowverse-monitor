
import { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from './ui/button';
import CustomNode from './CustomNode';
import NodeDetails from './NodeDetails';

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    data: { 
      label: 'User Input',
      status: 'active',
      type: 'input',
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
      type: 'process',
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
      type: 'ai',
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
      type: 'process',
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
      type: 'output',
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

const FlowView = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const closeNodeDetails = () => {
    setSelectedNode(null);
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="sm">Zoom In</Button>
        <Button variant="outline" size="sm">Zoom Out</Button>
        <Button variant="outline" size="sm">Reset View</Button>
      </div>
      <div style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </div>
      {selectedNode && (
        <NodeDetails node={selectedNode} onClose={closeNodeDetails} />
      )}
    </div>
  );
};

export default FlowView;
