
import { useState, useEffect } from 'react';
import { Search, Calendar, AlertCircle, Download, Filter, RefreshCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { Json } from "@/integrations/supabase/types";

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

interface LogEntry {
  id: string;
  timestamp: string;
  nodeName: string;
  nodeId: string;
  eventType: string;
  details: string;
}

const LogsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ 
    from: subDays(new Date(), 7), 
    to: new Date() 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uniqueNodes, setUniqueNodes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const pageSize = 10;

  // Helper function to safely extract message from Json details
  const extractMessage = (details: Json | null): string => {
    if (!details) return 'No details available';
    
    // If details is a string, return it directly
    if (typeof details === 'string') return details;
    
    // If details is an object and has a message property
    if (typeof details === 'object' && details !== null) {
      const detailsObj = details as Record<string, unknown>;
      if ('message' in detailsObj && typeof detailsObj.message === 'string') {
        return detailsObj.message;
      }
      // Return JSON stringified version as fallback
      return JSON.stringify(details);
    }
    
    // Fallback for other types
    return String(details);
  };

  // Fetch logs from Supabase
  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('agent_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Apply date range filter
      if (dateRange.from) {
        query = query.gte('timestamp', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        query = query.lte('timestamp', format(dateRange.to, 'yyyy-MM-dd 23:59:59'));
      }

      // Apply event type filter
      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      // Apply node filter
      if (nodeFilter !== 'all') {
        query = query.eq('agent_name', nodeFilter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`agent_name.ilike.%${searchTerm}%,details->>'message'.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match our expected format
      const formattedLogs = data.map(log => ({
        id: log.id,
        timestamp: format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        nodeName: log.agent_name,
        nodeId: log.id.slice(0, 8), // Use first 8 chars of ID as node ID
        eventType: log.event_type,
        details: extractMessage(log.details)
      }));

      setLogs(formattedLogs);
      setTotalPages(Math.ceil((count || 0) / pageSize));

      // Fetch unique nodes for filter
      const nodesQuery = await supabase
        .from('agent_logs')
        .select('agent_name');
        
      // Process the results to get unique node names
      if (nodesQuery.data) {
        const nodeNames = nodesQuery.data.map(item => item.agent_name);
        // Filter out duplicates
        const uniqueNodeNames = [...new Set(nodeNames)];
        setUniqueNodes(uniqueNodeNames);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error fetching logs',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:agent_logs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'agent_logs' 
      }, (payload) => {
        // When a new log is added, refresh the logs
        fetchLogs();
        toast({
          title: 'New log received',
          description: `${payload.new.agent_name}: ${payload.new.event_type}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, eventTypeFilter, nodeFilter, dateRange.from, dateRange.to, currentPage]);

  const handleDebug = (log: LogEntry) => {
    setSelectedLog(log);
    setShowDebugDialog(true);
  };

  const getSuggestions = (details: string) => {
    for (const key in debugSuggestions) {
      if (details.includes(key)) {
        return debugSuggestions[key as keyof typeof debugSuggestions];
      }
    }
    return ['No specific suggestions available for this error.'];
  };

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange({
      from: range.from || subDays(new Date(), 7),
      to: range.to || new Date()
    });
    if (range.from && range.to) {
      setShowDatePicker(false);
    }
  };

  const exportLogs = async () => {
    setIsExporting(true);
    try {
      // Fetch all logs without pagination for export
      let query = supabase
        .from('agent_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply same filters as the view
      if (dateRange.from) {
        query = query.gte('timestamp', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        query = query.lte('timestamp', format(dateRange.to, 'yyyy-MM-dd 23:59:59'));
      }
      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }
      if (nodeFilter !== 'all') {
        query = query.eq('agent_name', nodeFilter);
      }
      if (searchTerm) {
        query = query.or(`agent_name.ilike.%${searchTerm}%,details->>'message'.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Convert to CSV
      const headers = ['Timestamp', 'Node Name', 'Event Type', 'Details'];
      const csvContent = [
        headers.join(','),
        ...data.map(log => [
          new Date(log.timestamp).toISOString(),
          log.agent_name,
          log.event_type,
          JSON.stringify(log.details).replace(/,/g, ';') // Avoid CSV commas in JSON
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `flowverse_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Logs exported successfully',
        description: `${data.length} log entries exported to CSV`,
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'Error exporting logs',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Function to generate the filtered logs for display
  const getFilteredLogs = () => {
    if (loading) {
      return Array(5).fill(0).map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-b border-gray-700">
          <td className="p-2"><Skeleton className="h-6 w-32 bg-gray-700" /></td>
          <td className="p-2"><Skeleton className="h-6 w-40 bg-gray-700" /></td>
          <td className="p-2"><Skeleton className="h-6 w-20 bg-gray-700" /></td>
          <td className="p-2"><Skeleton className="h-6 w-full bg-gray-700" /></td>
          <td className="p-2 text-center"><Skeleton className="h-6 w-20 bg-gray-700 mx-auto" /></td>
        </tr>
      ));
    }

    if (logs.length === 0) {
      return (
        <tr className="border-b border-gray-700">
          <td colSpan={5} className="p-4 text-center text-gray-400">
            No logs found with the current filters. Try adjusting your search criteria.
          </td>
        </tr>
      );
    }

    return logs.map((log) => (
      <tr key={log.id} className="border-b border-gray-700">
        <td className="p-2 text-gray-400">{log.timestamp}</td>
        <td className="p-2">
          <span className="flex items-center gap-1">
            {log.nodeName}
            <span className="text-xs text-gray-500">({log.nodeId})</span>
          </span>
        </td>
        <td className="p-2">
          <span className={`inline-block px-2 py-1 rounded-full text-xs ${eventTypeColors[log.eventType as keyof typeof eventTypeColors] || 'bg-gray-700 text-gray-300'}`}>
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
    ));
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <div className="flex gap-2">
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2 items-center border-gray-700">
                <Calendar className="h-4 w-4" />
                <span>
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Date Range"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="end">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                initialFocus
                classNames={{
                  day_selected: "bg-indigo-600 text-white", 
                  day_range_middle: "bg-indigo-500 text-white",
                  day_range_end: "bg-indigo-600 text-white"
                }}
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="outline" 
            className="flex gap-2 items-center border-gray-700" 
            onClick={exportLogs}
            disabled={isExporting}
          >
            {isExporting ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
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
            <Button 
              className="flex gap-1 items-center bg-gray-700 hover:bg-gray-600"
              onClick={() => {
                setSearchTerm('');
                setEventTypeFilter('all');
                setNodeFilter('all');
                setDateRange({ from: subDays(new Date(), 7), to: new Date() });
                setCurrentPage(1);
              }}
            >
              <Filter className="h-4 w-4" />
              <span>Reset Filters</span>
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
              {getFilteredLogs()}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
