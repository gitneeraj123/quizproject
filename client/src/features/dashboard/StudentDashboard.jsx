import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function StudentDashboard() {
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch all quizzes and the student's past results simultaneously
        const [quizzesRes, resultsRes] = await Promise.all([
          api.get('/quizzes'),
          api.get('/results/my-results')
        ]);

        const allQuizzes = quizzesRes.data.data;
        const pastResults = resultsRes.data.data;

        // Filter out quizzes the student has already taken
        const takenQuizIds = new Set(pastResults.map(r => r.quiz?._id));
        const pendingQuizzes = allQuizzes.filter(q => !takenQuizIds.has(q._id));

        setAvailableQuizzes(pendingQuizzes);
        setMyResults(pastResults);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) return <div className="p-8 text-gray-500">Loading your portal...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-primary">Student Portal</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here are your pending assignments and past scores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Pending Assessments */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
              {availableQuizzes.length}
            </span>
            Available Assessments
          </h2>
          
          {availableQuizzes.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 italic">
              You are all caught up! No pending assessments.
            </div>
          ) : (
            <div className="space-y-4">
              {availableQuizzes.map(quiz => (
                <div key={quiz._id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
                  <h3 className="font-bold text-lg text-gray-900">{quiz.title}</h3>
                  <div className="text-sm text-gray-500 mt-2 mb-4 flex space-x-4">
                    <span>⏱ {quiz.durationMinutes} Minutes</span>
                    <span>📝 {quiz.questions?.length || 0} Questions</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/quiz/${quiz._id}`)}
                    className="w-full py-2 bg-primary text-white font-medium rounded hover:bg-opacity-90 transition"
                  >
                    Start Assessment
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Past Results */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-3">
              {myResults.length}
            </span>
            Completed Exams
          </h2>

          {myResults.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 italic">
              You haven't completed any assessments yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myResults.map(result => {
                const percentage = Math.round((result.score / result.totalMarks) * 100);
                const passed = percentage >= 60;

                return (
                  <div key={result._id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{result.quiz?.title || 'Unknown Quiz'}</h3>
                      <p className="text-sm text-gray-500 mt-1">Completed: {formatDate(result.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {percentage}%
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        {result.score} / {result.totalMarks} Points
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}