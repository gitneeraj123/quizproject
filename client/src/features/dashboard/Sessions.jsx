import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function Sessions() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Because we use 'api', this automatically attaches your Teacher JWT token!
        const response = await api.get('/quizzes');
        setQuizzes(response.data.data);
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
        setError('Could not load your assessments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleCopyLink = (quizId) => {
    navigator.clipboard.writeText(`${window.location.origin}/take-quiz/${quizId}`);
    alert('Student link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl font-bold text-gray-400 animate-pulse">Loading Assessments...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Sessions</h1>
          <p className="text-gray-500">View your published quizzes and analyze student performance.</p>
        </div>
        <Link 
          to="/dashboard/create-quiz" 
          className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors shadow-sm"
        >
          + New Assessment
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {quizzes.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            You haven't published any assessments yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4 pl-6">Assessment Name</th>
                <th className="p-4">Subject & Grade</th>
                <th className="p-4">Questions</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quizzes.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6 font-bold text-gray-900">{quiz.title}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {quiz.subject} <span className="text-gray-300 mx-2">|</span> {quiz.grade}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{quiz.questions?.length || 0}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 pr-6 flex justify-end gap-3">
                    <button 
                      onClick={() => handleCopyLink(quiz._id)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      🔗 Link
                    </button>
                    {/* This link routes to our final ReportDetail page! */}
                    <Link 
                      to={`/dashboard/sessions/${quiz._id}`}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                    >
                      View Results →
                    </Link>
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