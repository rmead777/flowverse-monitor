import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import FlowView from "@/components/FlowView";
import { Cpu, Save, Download, Play, LogOut, FolderOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ReactFlowProvider } from "reactflow";
import FlowSidebar from "@/components/sidebar/FlowSidebar";
import PropertyPanel from "@/components/PropertyPanel/PropertyPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeBaseView from "@/components/views/KnowledgeBaseView";
import MetricsDashboardView from "@/components/views/MetricsDashboardView";
import FeedbackAnalysisView from "@/components/views/FeedbackAnalysisView";
import LogsView from "@/components/views/LogsView";
import SaveFlowDialog from "@/components/SaveFlowDialog";
import LoadFlowDialog from "@/components/LoadFlowDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { signOut, user } = useAuth();
  const [selectedNode, setSelectedNode] = useState(null);
  const [flowData, setFlowData] = useState({ nodes: [], edges: [] });
  const [activeTab, setActiveTab] = useState("flow");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flowConfigurations, setFlowConfigurations] = useState([]);
  const { toast } = useToast();

  const handleSelectTemplate = useCallback((nodes, edges) => {
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

  const fetchFlowConfigurations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('flow_configurations')
        .select('*')
        .order('updated_at', { ascending: false });
        
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
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchFlowConfigurations();
    }
  }, [user, fetchFlowConfigurations]);

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
      const flowDataToSave = {
        user_id: user.id,
        name,
        description,
        nodes: flowData.nodes,
        edges: flowData.edges,
      };
      
      const { error } = await supabase
        .from('flow_configurations')
        .insert([flowDataToSave]);
        
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
  }, [user, flowData, toast, fetchFlowConfigurations]);

  const loadFlow = useCallback((flowConfig) => {
    try {
      setFlowData({
        nodes: flowConfig.nodes || [],
        edges: flowConfig.edges || []
      });
      
      setIsLoadDialogOpen(false);
      
      toast({
        title: 'Flow loaded successfully',
        description: `Flow "${flowConfig.name}" has been loaded`,
      });
    } catch (error) {
      console.error('Error loading flow:', error);
      toast({
        title: 'Error loading flow',
        description: 'There was a problem loading the selected flow',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
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
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={isLoading || !user}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
            onClick={() => setIsLoadDialogOpen(true)}
            disabled={isLoading || !user}
          >
            <FolderOpen className="h-4 w-4" />
            Load
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

      <div className="border-b border-gray-800 bg-gray-950 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="flow" className="data-[state=active]:bg-indigo-600">Flow Editor</TabsTrigger>
            <TabsTrigger value="kb" className="data-[state=active]:bg-indigo-600">Knowledge Bases</TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-indigo-600">Metrics Dashboard</TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-indigo-600">Feedback Analysis</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-indigo-600">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="flex flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
            <ReactFlowProvider>
              <FlowSidebar onSelectTemplate={handleSelectTemplate} />
              <div className="flex-1 overflow-hidden bg-gray-950">
                <FlowView 
                  onNodeSelect={handleNodeSelect} 
                  initialFlowData={flowData}
                  key={JSON.stringify(flowData)}
                />
              </div>
              <PropertyPanel 
                selectedNode={selectedNode} 
                onUpdateNode={handleNodeUpdate}
                onClose={() => setSelectedNode(null)}
              />
            </ReactFlowProvider>
          </TabsContent>

          <TabsContent value="kb" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <KnowledgeBaseView />
          </TabsContent>

          <TabsContent value="metrics" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <MetricsDashboardView />
          </TabsContent>

          <TabsContent value="logs" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <LogsView />
          </TabsContent>

          <TabsContent value="feedback" className="flex-1 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
            <FeedbackAnalysisView />
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* The actual content is rendered in TabsContent above */}
        </div>
      </div>

      <div className="border-t border-gray-800 p-2 bg-gray-950 text-gray-400 text-xs flex justify-between">
        <div>5 agents active</div>
        <div>Last update: {new Date().toLocaleTimeString()}</div>
      </div>

      <SaveFlowDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={saveFlow}
        isLoading={isLoading}
        existingFlows={flowConfigurations}
      />

      <LoadFlowDialog
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onLoad={loadFlow}
        isLoading={isLoading}
        flows={flowConfigurations}
        fetchFlows={fetchFlowConfigurations}
      />
    </div>
  );
};

export default Index;
