
import { Button } from "@/components/ui/button";
import FlowView from "@/components/FlowView";
import { Cpu, Save, Download, Play, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { signOut } = useAuth();

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
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-800 bg-gray-950 p-4">
          <div className="space-y-2">
            <div className="px-3 py-2 rounded bg-gray-800 text-white font-medium flex items-center">
              Flow Overview
            </div>
            <div className="px-3 py-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer">
              Agent Metrics
            </div>
            <div className="px-3 py-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer">
              Logs
            </div>
          </div>
        </div>

        {/* Flow View */}
        <div className="flex-1 overflow-hidden bg-gray-950">
          <FlowView />
        </div>
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
