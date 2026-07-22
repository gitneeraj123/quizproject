import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function Analytics() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get('/results');
        setResults(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Helper to format seconds into readable MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Helper to format the submission date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Analytics...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Student Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Review assessment results across your organization.</p>
      </div>

      {/* Analytics KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Total Submissions</h3>
          <p className="text-3xl font-bold text-primary mt-2">{results.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {results.length > 0 
              ? Math.round((results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks), 0) / results.length) * 100) 
              : 0}%
          </p>
        </div>
      </div>

      {/* Results Data Table */}
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Recent Exam Results</h2>
        </div>
        
        {results.length === 0 ? (
          <div className="p-6 text-center text-gray-500 italic">No students have taken an assessment yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-border">
                  <th className="px-6 py-3 font-medium">Student Name</th>
                  <th className="px-6 py-3 font-medium">Assessment</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Time Taken</th>
                  <th className="px-6 py-3 font-medium">Submitted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((result) => {
                  const percentage = Math.round((result.score / result.totalMarks) * 100);
                  // Dynamic color based on pass/fail logic (e.g., > 60% is passing)
                  const scoreColor = percentage >= 60 ? 'text-green-600' : 'text-red-600';

                  return (
                    <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{result.student?.name || 'Unknown Student'}</div>
                        <div className="text-xs text-gray-500">{result.student?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{result.quiz?.title || 'Deleted Quiz'}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${scoreColor}`}>
                          {result.score} / {result.totalMarks} ({percentage}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatTime(result.timeSpentSeconds)}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(result.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}