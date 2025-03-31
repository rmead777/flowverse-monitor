
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import FlowView from "@/components/FlowView";
import { Cpu, Save, Download, Play, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ReactFlowProvider } from "reactflow";
import FlowSidebar from "@/components/sidebar/FlowSidebar";
import PropertyPanel from "@/components/PropertyPanel/PropertyPanel";

const Index = () => {
  const { signOut } = useAuth();
  const [selectedNode, setSelectedNode] = useState(null);
  const [flowData, setFlowData] = useState({ nodes: [], edges: [] });

  const handleSelectTemplate = useCallback((nodes, edges) => {
    setFlowData({ nodes, edges });
  }, []);

  const handleNodeSelect = useCallback((node) => {
    // Ensure node has a properly initialized data object with type information
    if (node && node.data) {
      // Initialize standard properties if they don't exist
      if (!node.data.type) {
        // Infer type from node's visual type if possible
        switch (node.type) {
          case 'input':
            node.data.type = 'userInput';
            if (!node.data.inputType) node.data.inputType = 'text';
            break;
          case 'output':
            node.data.type = 'aiResponse';
            if (!node.data.model) node.data.model = 'gpt-4o';
            if (node.data.temperature === undefined) node.data.temperature = 0.7;
            if (!node.data.maxTokens) node.data.maxTokens = 1024;
            break;
          case 'custom':
            // Try to infer from existing properties
            if (node.data.prompt !== undefined) node.data.type = 'systemPrompt';
            else if (node.data.endpoint !== undefined) node.data.type = 'apiCall';
            else if (node.data.actionType !== undefined) node.data.type = 'action';
            else if (node.data.configType !== undefined) node.data.type = 'configuration';
            break;
        }
      }
      
      // Initialize metrics if they don't exist
      if (!node.data.metrics) {
        node.data.metrics = {
          tasksProcessed: 0,
          errorRate: 0,
          latency: 0
        };
      }
    }
    
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback((updatedData) => {
    setFlowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === selectedNode.id 
          ? { ...node, data: updatedData } 
          : node
      )
    }));
  }, [selectedNode]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navbar */}
      <div className="border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Cpu className="h-6 w-6 mr-2 text-indigo-400" />
          <h1 className="text-xl font-bold">FlowVerse Monitor</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-green-500"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            size="sm" 
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
          >
            <Play className="h-4 w-4" />
            Run Flow
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-red-400 hover:text-white hover:bg-red-700"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowProvider>
          {/* Left Sidebar */}
          <FlowSidebar onSelectTemplate={handleSelectTemplate} />

          {/* Flow View */}
          <div className="flex-1 overflow-hidden bg-gray-950">
            <FlowView 
              onNodeSelect={handleNodeSelect} 
              initialFlowData={flowData}
            />
          </div>

          {/* Properties Panel */}
          <PropertyPanel 
            selectedNode={selectedNode} 
            onUpdateNode={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        </ReactFlowProvider>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-800 p-2 bg-gray-950 text-gray-400 text-xs flex justify-between">
        <div>5 agents active</div>
        <div>Last update: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default Index;
