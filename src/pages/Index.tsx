import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import FlowView from "@/components/FlowView";
import { Cpu, Save, Download, Play, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ReactFlowProvider } from "reactflow";
import FlowSidebar from "@/components/sidebar/FlowSidebar";
import PropertyPanel from "@/components/PropertyPanel/PropertyPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeBaseView from "@/components/views/KnowledgeBaseView";
import MetricsDashboardView from "@/components/views/MetricsDashboardView";
import FeedbackAnalysisView from "@/components/views/FeedbackAnalysisView";
import LogsView from "@/components/views/LogsView";

const Index = () => {
  const { signOut } = useAuth();
  const [selectedNode, setSelectedNode] = useState(null);
  const [flowData, setFlowData] = useState({ nodes: [], edges: [] });
  const [activeTab, setActiveTab] = useState("flow");

  const handleSelectTemplate = useCallback((nodes, edges) => {
    // Directly set the flow data from the template, which will replace any existing nodes/edges
    setFlowData({ 
      nodes: nodes || [], 
      edges: edges || [] 
    });
  }, []);

  const handleNodeSelect = useCallback((node) => {
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 bg-gray-950 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="flow" className="data-[state=active]:bg-indigo-600">Flow Editor</TabsTrigger>
            <TabsTrigger value="kb" className="data-[state=active]:bg-indigo-600">Knowledge Bases</TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-indigo-600">Metrics Dashboard</TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-indigo-600">Feedback Analysis</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-indigo-600">Logs</TabsTrigger>
          </TabsList>

          {/* TabsContent for flow (includes ReactFlowProvider) */}
          <TabsContent value="flow" className="flex flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
            <ReactFlowProvider>
              {/* Left Sidebar */}
              <FlowSidebar onSelectTemplate={handleSelectTemplate} />

              {/* Flow View */}
              <div className="flex-1 overflow-hidden bg-gray-950">
                <FlowView 
                  onNodeSelect={handleNodeSelect} 
                  initialFlowData={flowData}
                  key={JSON.stringify(flowData)} // Force re-render when flowData changes
                />
              </div>

              {/* Properties Panel */}
              <PropertyPanel 
                selectedNode={selectedNode} 
                onUpdateNode={handleNodeUpdate}
                onClose={() => setSelectedNode(null)}
              />
            </ReactFlowProvider>
          </TabsContent>

          {/* Other TabsContent elements without ReactFlowProvider */}
          <TabsContent value="kb" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <KnowledgeBaseView />
          </TabsContent>

          <TabsContent value="metrics" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <MetricsDashboardView />
          </TabsContent>

          <TabsContent value="feedback" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <FeedbackAnalysisView />
          </TabsContent>
          
          <TabsContent value="logs" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <LogsView />
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* The actual content is rendered in TabsContent above */}
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
