
import { LineChart, BarChart2, ThumbsUp, ThumbsDown, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart as RechartLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

const feedbackData = [
  { date: '2023-06-01', averageScore: 4.2, positiveCount: 15, negativeCount: 3, totalCount: 18 },
  { date: '2023-06-08', averageScore: 4.3, positiveCount: 18, negativeCount: 2, totalCount: 20 },
  { date: '2023-06-15', averageScore: 4.0, positiveCount: 12, negativeCount: 4, totalCount: 16 },
  { date: '2023-06-22', averageScore: 4.4, positiveCount: 20, negativeCount: 2, totalCount: 22 },
  { date: '2023-06-29', averageScore: 4.5, positiveCount: 22, negativeCount: 1, totalCount: 23 },
  { date: '2023-07-06', averageScore: 4.6, positiveCount: 24, negativeCount: 1, totalCount: 25 },
  { date: '2023-07-13', averageScore: 4.7, positiveCount: 26, negativeCount: 1, totalCount: 27 }
];

const recentFeedback = [
  { id: 'task-001', query: 'How do I implement a RAG system?', response: 'To implement a RAG system, you need to...', score: 5, comment: 'Excellent explanation, very clear!' },
  { id: 'task-002', query: 'What are the best vector databases?', response: 'The best vector databases for RAG systems include...', score: 4, comment: 'Good info but missing some newer options' },
  { id: 'task-003', query: 'How to optimize retrieval latency?', response: 'To optimize retrieval latency in a RAG system...', score: 2, comment: 'Advice didn\'t work for my use case' },
  { id: 'task-004', query: 'Embedding models comparison', response: 'When comparing embedding models for RAG...', score: 5, comment: 'Perfect comparison, helped me choose!' },
  { id: 'task-005', query: 'How to evaluate RAG quality?', response: 'Evaluating RAG quality requires measuring...', score: 3, comment: 'Could use more specific metrics' }
];

const improvementSuggestions = [
  { category: 'Relevance', suggestion: 'Adjust retriever filters to focus on more recent documents', impact: 'high' },
  { category: 'Accuracy', suggestion: 'Update knowledge base with latest technical specifications', impact: 'medium' },
  { category: 'Response Length', suggestion: 'Adjust max tokens to provide more comprehensive responses', impact: 'medium' },
  { category: 'Context', suggestion: 'Increase context window to include more relevant history', impact: 'high' }
];

const FeedbackAnalysisView = () => {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Feedback Analysis</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-indigo-400 mb-2">4.3</div>
          <div className="text-sm text-gray-400">Average Rating</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="h-5 w-5 text-green-400" />
            <span className="text-4xl font-bold text-green-400">88%</span>
          </div>
          <div className="text-sm text-gray-400">Positive Feedback</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown className="h-5 w-5 text-red-400" />
            <span className="text-4xl font-bold text-red-400">12%</span>
          </div>
          <div className="text-sm text-gray-400">Negative Feedback</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <LineChart className="h-5 w-5 text-blue-400 mr-2" />
            <h2 className="text-lg font-semibold">Average Feedback Score Trend</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartLineChart
                data={feedbackData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis domain={[0, 5]} stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} />
                <Legend />
                <Line type="monotone" dataKey="averageScore" stroke="#60a5fa" name="Average Score" />
              </RechartLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <BarChart2 className="h-5 w-5 text-green-400 mr-2" />
            <h2 className="text-lg font-semibold">Feedback Distribution</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={feedbackData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#555' }} />
                <Legend />
                <Bar dataKey="positiveCount" fill="#4ade80" name="Positive Feedback" />
                <Bar dataKey="negativeCount" fill="#f87171" name="Negative Feedback" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Recent Feedback</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Task ID</th>
                  <th className="text-left p-2">Query</th>
                  <th className="text-center p-2">Score</th>
                  <th className="text-left p-2">Comment</th>
                </tr>
              </thead>
              <tbody>
                {recentFeedback.map((feedback) => (
                  <tr key={feedback.id} className="border-b border-gray-700">
                    <td className="p-2 text-gray-400">{feedback.id}</td>
                    <td className="p-2 truncate max-w-xs">{feedback.query}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        feedback.score >= 4 ? 'bg-green-900 text-green-300' : 
                        feedback.score >= 3 ? 'bg-blue-900 text-blue-300' : 
                        'bg-red-900 text-red-300'
                      }`}>
                        {feedback.score}/5
                      </span>
                    </td>
                    <td className="p-2 truncate max-w-xs">{feedback.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Improvement Suggestions</h2>
          <div className="space-y-3">
            {improvementSuggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gray-750">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{suggestion.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    suggestion.impact === 'high' ? 'bg-red-900 text-red-300' :
                    suggestion.impact === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-blue-900 text-blue-300'
                  }`}>
                    {suggestion.impact} impact
                  </span>
                </div>
                <p className="text-sm text-gray-400">{suggestion.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalysisView;
