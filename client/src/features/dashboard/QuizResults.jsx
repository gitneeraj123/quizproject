import { useState } from 'react';

export default function QuizResults() {
  // Mock data representing students who completed the quiz
  const [results] = useState([
    { id: 1, name: 'Arjun Kumar', identifier: 'CS-2024-001', score: 18, total: 20, time: '12m 45s', date: 'Oct 24, 2024 - 10:30 AM', status: 'Completed' },
    { id: 2, name: 'Priya Sharma', identifier: 'CS-2024-042', score: 20, total: 20, time: '09m 12s', date: 'Oct 24, 2024 - 10:45 AM', status: 'Completed' },
    { id: 3, name: 'Rahul Desai', identifier: 'CS-2024-118', score: 12, total: 20, time: '15m 00s', date: 'Oct 24, 2024 - 11:05 AM', status: 'Completed' },
    { id: 4, name: 'Anita Patel', identifier: 'CS-2024-089', score: '-', total: 20, time: 'In Progress', date: 'Oct 24, 2024 - 11:20 AM', status: 'Active' },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <button className="text-gray-500 hover:text-gray-900 text-sm font-bold flex items-center gap-1 mb-4">← Back to Assessments</button>
          <h1 className="text-3xl font-bold text-gray-900">Exploring the World of AI</h1>
          <p className="text-gray-500 mt-1">Live Results & Analytics</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50">Export CSV</button>
          <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold shadow hover:bg-pink-700">Close Assessment</button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-2">Total Participants</div>
          <div className="text-3xl font-bold text-gray-900">24</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-2">Average Score</div>
          <div className="text-3xl font-bold text-green-600">82%</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-2">Avg. Completion Time</div>
          <div className="text-3xl font-bold text-gray-900">11m 30s</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-2">Hardest Question</div>
          <div className="text-3xl font-bold text-red-500">Q. 4</div>
        </div>
      </div>

      {/* Participant Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Participant Responses</h3>
          <input type="text" placeholder="Search name or ID..." className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-pink-500" />
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4 font-bold">Student Name</th>
              <th className="px-6 py-4 font-bold">Identifier</th>
              <th className="px-6 py-4 font-bold text-center">Score</th>
              <th className="px-6 py-4 font-bold">Time Taken</th>
              <th className="px-6 py-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((res) => (
              <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{res.name}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-sm">{res.identifier}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`font-bold ${res.score >= 15 ? 'text-green-600' : res.score >= 10 ? 'text-yellow-600' : 'text-gray-400'}`}>
                    {res.score !== '-' ? `${res.score} / ${res.total}` : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">{res.time}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${res.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {res.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}