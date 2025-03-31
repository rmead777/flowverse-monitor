
import { useState } from 'react';
import { Search, Calendar, AlertCircle, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const logs = [
  { id: '1', timestamp: '2023-07-13 14:23:45', nodeName: 'Retriever', nodeId: 'retriever-1a2b3c', eventType: 'info', details: 'Retrieved 5 documents successfully' },
  { id: '2', timestamp: '2023-07-13 14:23:46', nodeName: 'Context Manager', nodeId: 'contextManager-4d5e6f', eventType: 'info', details: 'Updated context with 5 new documents' },
  { id: '3', timestamp: '2023-07-13 14:23:47', nodeName: 'AI Response', nodeId: 'aiResponse-7g8h9i', eventType: 'info', details: 'Generated response in 890ms' },
  { id: '4', timestamp: '2023-07-13 14:24:01', nodeName: 'Retriever', nodeId: 'retriever-1a2b3c', eventType: 'warning', details: 'Similarity threshold not met for 2 documents' },
  { id: '5', timestamp: '2023-07-13 14:24:05', nodeName: 'Feedback', nodeId: 'feedback-0j1k2l', eventType: 'info', details: 'Received feedback score: 4/5' },
  { id: '6', timestamp: '2023-07-13 14:30:22', nodeName: 'API Call', nodeId: 'apiCall-3m4n5o', eventType: 'error', details: 'Connection timeout after 5000ms' },
  { id: '7', timestamp: '2023-07-13 14:31:15', nodeName: 'API Call', nodeId: 'apiCall-3m4n5o', eventType: 'info', details: 'Retry successful after 1 attempt' },
  { id: '8', timestamp: '2023-07-13 14:35:02', nodeName: 'System Prompt', nodeId: 'systemPrompt-6p7q8r', eventType: 'info', details: 'Prompt updated by user' },
  { id: '9', timestamp: '2023-07-13 14:40:18', nodeName: 'AI Response', nodeId: 'aiResponse-7g8h9i', eventType: 'warning', details: 'Response exceeds recommended length' },
  { id: '10', timestamp: '2023-07-13 14:45:33', nodeName: 'Context Manager', nodeId: 'contextManager-4d5e6f', eventType: 'error', details: 'Failed to store context in Supabase' }
];

const eventTypeColors = {
  info: 'bg-blue-900 text-blue-300',
  warning: 'bg-yellow-900 text-yellow-300',
  error: 'bg-red-900 text-red-300'
};

const debugSuggestions = {
  'Failed to store context in Supabase': [
    'Check Supabase credentials and permissions',
    'Verify that the Supabase table exists',
    'Check network connectivity to Supabase',
    'Ensure Context Manager node is properly configured'
  ],
  'Connection timeout after 5000ms': [
    'Check API endpoint URL',
    'Increase timeout threshold in configuration',
    'Verify network connectivity',
    'Check if API service is experiencing downtime'
  ]
};

const LogsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEventType = eventTypeFilter === 'all' || log.eventType === eventTypeFilter;
    const matchesNode = nodeFilter === 'all' || log.nodeName === nodeFilter;
    
    return matchesSearch && matchesEventType && matchesNode;
  });

  const uniqueNodes = Array.from(new Set(logs.map(log => log.nodeName)));

  const handleDebug = (log) => {
    setSelectedLog(log);
    setShowDebugDialog(true);
  };

  const getSuggestions = (details) => {
    for (const key in debugSuggestions) {
      if (details.includes(key)) {
        return debugSuggestions[key];
      }
    }
    return ['No specific suggestions available for this error.'];
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex gap-2 items-center border-gray-700">
            <Calendar className="h-4 w-4" />
            <span>Date Range</span>
          </Button>
          <Button variant="outline" className="flex gap-2 items-center border-gray-700">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-xs text-gray-400 mb-1 block">Event Type</label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs text-gray-400 mb-1 block">Node</label>
              <Select value={nodeFilter} onValueChange={setNodeFilter}>
                <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Node Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Nodes</SelectItem>
                  {uniqueNodes.map(node => (
                    <SelectItem key={node} value={node}>{node}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="flex gap-1 items-center bg-gray-700 hover:bg-gray-600">
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Timestamp</th>
                <th className="text-left p-2">Node Name</th>
                <th className="text-left p-2">Event Type</th>
                <th className="text-left p-2">Details</th>
                <th className="text-center p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-700">
                  <td className="p-2 text-gray-400">{log.timestamp}</td>
                  <td className="p-2">
                    <span className="flex items-center gap-1">
                      {log.nodeName}
                      <span className="text-xs text-gray-500">({log.nodeId})</span>
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${eventTypeColors[log.eventType] || 'bg-gray-700 text-gray-300'}`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="p-2 truncate max-w-xs">{log.details}</td>
                  <td className="p-2 text-center">
                    {log.eventType === 'error' && (
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDebug(log)}>
                        <AlertCircle className="h-4 w-4" />
                        <span className="ml-1">Debug</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
          <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Debug: {selectedLog.eventType.toUpperCase()} in {selectedLog.nodeName}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4 p-3 bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium mb-1">Error details:</h3>
                <p className="text-red-400">{selectedLog.details}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Suggested fixes:</h3>
                <ul className="space-y-2">
                  {getSuggestions(selectedLog.details).map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDebugDialog(false)} className="border-gray-700 text-gray-300">
                Close
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Apply Fix
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LogsView;
