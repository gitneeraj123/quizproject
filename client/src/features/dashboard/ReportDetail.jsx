import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ReportDetail() {
  const { quizId } = useParams();
  const [reports, setReports] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tracks which student's detailed review is currently open
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportsRes = await api.get(`/results/quiz/${quizId}`);
        setReports(reportsRes.data.data);

        // Use each result's own snapshot instead of a live quiz fetch — this keeps
        // reports working even after the original Quiz document is deleted.
        const firstSnapshot = reportsRes.data.data?.[0]?.quizSnapshot;
        setQuiz(firstSnapshot || null);
      } catch (err) {
        console.error('Failed to fetch report details:', err);
        setError('Could not retrieve detailed results. Verify your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId]);

  const toggleRow = (reportId) => {
    setExpandedRow(expandedRow === reportId ? null : reportId);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-xl font-bold text-gray-400 animate-pulse">Loading Student Scores...</div>
      </div>
    );
  }

  const totalSubmissions = reports.length;
  const averageAccuracy = totalSubmissions > 0 
    ? Math.round(reports.reduce((acc, curr) => acc + curr.accuracy, 0) / totalSubmissions) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <Link to="/dashboard/sessions" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-1">Performance Report</h1>
        <p className="text-gray-500">Real-time statistics and detailed answer reviews.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Submissions</div>
          <div className="text-4xl font-bold text-gray-900 mt-1">{totalSubmissions}</div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Average Accuracy</div>
          <div className="text-4xl font-bold text-indigo-600 mt-1">{averageAccuracy}%</div>
        </div>
      </div>

      {/* Student Leaderboard / Grades Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            No students have completed this assessment yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4 pl-6">Student Name</th>
                <th className="p-4">Identifier</th>
                <th className="p-4">Raw Score</th>
                <th className="p-4">Accuracy</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <React.Fragment key={report._id}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-gray-900">{report.studentName}</td>
                    <td className="p-4 text-sm text-gray-600">{report.studentIdentifier || 'N/A'}</td>
                    <td className="p-4 text-sm font-medium text-gray-700">
                      {report.score} / {report.totalQuestions}
                      {report.tabSwitchCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full">
                          ⚠️ Left tab {report.tabSwitchCount}x
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        report.accuracy >= 80 ? 'bg-green-50 text-green-700' :
                        report.accuracy >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {report.accuracy}%
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => toggleRow(report._id)}
                        className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors"
                      >
                        {expandedRow === report._id ? 'Close Review' : 'Review Answers ⬇'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Detailed Review Row */}
                  {expandedRow === report._id && quiz && quiz.questions && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan="5" className="p-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-inner">
                          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
                            Detailed Submission Review for {report.studentName}
                          </h3>
                          
                          <div className="space-y-6">
                            {quiz.questions.map((question, index) => {
                              // Safely extract what the student selected
                              const studentRaw = report.studentAnswers?.[index];
                              const studentSelectedIndices = Array.isArray(studentRaw) 
                                ? studentRaw 
                                : (studentRaw !== undefined && studentRaw !== null ? [studentRaw] : []);
                              
                              return (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                  <p className="font-bold text-gray-900 mb-3">
                                    <span className="text-gray-400 mr-2">{index + 1}.</span> 
                                    {question.question}
                                  </p>
                                  
                                  <div className="space-y-2 pl-6">
                                    {question.options.map((opt, optIdx) => {
                                      const isSelected = studentSelectedIndices.includes(optIdx) || studentSelectedIndices.includes(optIdx.toString());
                                      // If the teacher endpoint didn't provide correct answers, we just show what the student picked
                                      const isCorrectAnswer = question.correctAnswers?.includes(optIdx);
                                      
                                      let statusClass = "text-gray-600";
                                      let icon = "⚪";

                                      if (isSelected && isCorrectAnswer) {
                                        statusClass = "text-green-700 font-bold bg-green-50 border-green-200";
                                        icon = "✅";
                                      } else if (isSelected && !isCorrectAnswer) {
                                        statusClass = "text-red-700 font-bold bg-red-50 border-red-200";
                                        icon = "❌";
                                      } else if (!isSelected && isCorrectAnswer) {
                                        statusClass = "text-green-600 font-medium bg-green-50/50 border-green-100";
                                        icon = "✔️"; // Show the missed correct answer
                                      }

                                      return (
                                        <div key={optIdx} className={`px-3 py-2 rounded-md border border-transparent flex items-start gap-2 text-sm ${isSelected ? statusClass : ''} ${!isSelected && isCorrectAnswer ? statusClass : ''}`}>
                                          <span className="mt-0.5">{icon}</span>
                                          <span>{typeof opt === 'string' ? opt : opt.text}</span>
                                          {isSelected && !isCorrectAnswer && <span className="ml-auto text-xs font-bold text-red-500 uppercase tracking-wider">Student Selected</span>}
                                          {isSelected && isCorrectAnswer && <span className="ml-auto text-xs font-bold text-green-500 uppercase tracking-wider">Correct</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}