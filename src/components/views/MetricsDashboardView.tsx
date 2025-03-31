
import { BarChart2, LineChart, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart as RechartLineChart } from "recharts";

const metricsData = [
  { date: '2023-06-01', recallRate: 0.75, precision: 0.82, retrievalLatency: 350, generationLatency: 890, responseRelevance: 0.85 },
  { date: '2023-06-08', recallRate: 0.78, precision: 0.84, retrievalLatency: 330, generationLatency: 870, responseRelevance: 0.87 },
  { date: '2023-06-15', recallRate: 0.72, precision: 0.80, retrievalLatency: 380, generationLatency: 920, responseRelevance: 0.83 },
  { date: '2023-06-22', recallRate: 0.79, precision: 0.85, retrievalLatency: 320, generationLatency: 850, responseRelevance: 0.86 },
  { date: '2023-06-29', recallRate: 0.81, precision: 0.87, retrievalLatency: 300, generationLatency: 830, responseRelevance: 0.88 },
  { date: '2023-07-06', recallRate: 0.83, precision: 0.88, retrievalLatency: 290, generationLatency: 810, responseRelevance: 0.89 },
  { date: '2023-07-13', recallRate: 0.85, precision: 0.90, retrievalLatency: 270, generationLatency: 790, responseRelevance: 0.91 }
];

const recentTasks = [
  { id: 'task-001', query: 'How do I implement a RAG system?', retrievedDocs: 5, response: 'To implement a RAG system, you need to...', relevanceScore: 0.92 },
  { id: 'task-002', query: 'What are the best vector databases?', retrievedDocs: 3, response: 'The best vector databases for RAG systems include...', relevanceScore: 0.88 },
  { id: 'task-003', query: 'How to optimize retrieval latency?', retrievedDocs: 4, response: 'To optimize retrieval latency in a RAG system...', relevanceScore: 0.85 },
  { id: 'task-004', query: 'Embedding models comparison', retrievedDocs: 6, response: 'When comparing embedding models for RAG...', relevanceScore: 0.90 },
  { id: 'task-005', query: 'How to evaluate RAG quality?', retrievedDocs: 4, response: 'Evaluating RAG quality requires measuring...', relevanceScore: 0.94 }
];

const MetricsDashboardView = () => {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Metrics Dashboard</h1>
        <div className="flex gap-4 items-center">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex gap-2 items-center border-gray-700">
            <Calendar className="h-4 w-4" />
            <span>Custom Range</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <LineChart className="h-5 w-5 text-blue-400 mr-2" />
            <h2 className="text-lg font-semibold">Recall Rate & Response Relevance</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartLineChart
                data={metricsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} />
                <Legend />
                <Line type="monotone" dataKey="recallRate" stroke="#60a5fa" name="Recall Rate" />
                <Line type="monotone" dataKey="responseRelevance" stroke="#4ade80" name="Response Relevance" />
              </RechartLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <BarChart2 className="h-5 w-5 text-green-400 mr-2" />
            <h2 className="text-lg font-semibold">Latency Comparison</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} />
                <Legend />
                <Bar dataKey="retrievalLatency" fill="#60a5fa" name="Retrieval Latency (ms)" />
                <Bar dataKey="generationLatency" fill="#f97316" name="Generation Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Task ID</th>
                <th className="text-left p-2">Query</th>
                <th className="text-center p-2">Retrieved Docs</th>
                <th className="text-left p-2">Generated Response</th>
                <th className="text-center p-2">Relevance Score</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-700">
                  <td className="p-2 text-gray-400">{task.id}</td>
                  <td className="p-2">{task.query}</td>
                  <td className="p-2 text-center">{task.retrievedDocs}</td>
                  <td className="p-2 truncate max-w-xs">{task.response}</td>
                  <td className="p-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      task.relevanceScore >= 0.9 ? 'bg-green-900 text-green-300' : 
                      task.relevanceScore >= 0.8 ? 'bg-blue-900 text-blue-300' : 
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {task.relevanceScore.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboardView;
