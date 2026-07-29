import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Added React Router navigation
import api from '../../services/api'; 

export default function Overview() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. Initialize navigate
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await api.get('/quizzes');
        setQuizzes(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Organization Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your published assessments and exams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Total Assessments</h3>
          <p className="text-3xl font-bold text-primary mt-2">{quizzes.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Active Exams</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {quizzes.filter(q => q.status === 'published').length}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Recent Quizzes</h2>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="p-6 text-center text-gray-500 italic">No quizzes created yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-border">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Questions</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Status</th>
                {/* 3. Added Action Column Header */}
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quizzes.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{quiz.title}</td>
                  <td className="px-6 py-4 text-gray-600">{quiz.questions?.length || 0} items</td>
                  <td className="px-6 py-4 text-gray-600">{quiz.durationMinutes} min</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {quiz.status || 'Active'}
                    </span>
                  </td>
                  {/* 4. Added the Take Assessment Button */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/take-quiz/${quiz._id}`;
                        navigator.clipboard.writeText(link);
                        alert('Student link copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition shadow"
                    >
                      Copy Student Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}