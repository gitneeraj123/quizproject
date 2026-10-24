import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function TakeQuiz() {
  const { id } = useParams(); 
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isNotLiveYet, setIsNotLiveYet] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: [selections] }
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [markedForReview, setMarkedForReview] = useState({});

  // 1. Fetch Assessment Data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/student`);
        const quizData = res.data.data;
        
        if (quizData.startsAt && new Date() < new Date(quizData.startsAt)) {
          setIsNotLiveYet(true);
        }
        if (quizData.expiresAt && new Date() > new Date(quizData.expiresAt)) {
          setIsExpired(true);
        }

        setQuiz(quizData);
        setLoading(false);
      } catch {
        setError('Quiz not found or link is invalid.');
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  // 2. Timer Initialization Logic
  useEffect(() => {
    if (hasStarted && quiz && quiz.questions) {
      if (quiz.timerType === 'question') {
        const currentGlobalQ = quiz.questions[currentQuestion];
        const currentQTime = currentGlobalQ?.timeLimit || 1;
        setTimeLeft(currentQTime * 60);
      } else if (timeLeft === null) {
        const totalMinutes = quiz.questions.reduce((sum, q) => sum + (q.timeLimit || 1), 0);
        setTimeLeft(totalMinutes * 60);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, quiz, currentQuestion]);

  // 3. Countdown Counter Engine
  useEffect(() => {
    if (timeLeft === null || result || isSubmitting || !hasStarted) return;

    if (timeLeft <= 0) {
      if (quiz.timerType === 'question') {
        handleNextOrAdvance();
      } else {
        handleSubmit(); 
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, result, isSubmitting, hasStarted]);

  // 4. Anti-Cheat: Disable copy, cut, and right-click during the live quiz
  useEffect(() => {
    if (!hasStarted || result) return;

    const blockAction = (e) => e.preventDefault();

    document.addEventListener('copy', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('contextmenu', blockAction);

    return () => {
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('contextmenu', blockAction);
    };
  }, [hasStarted, result]);

  // 5. Anti-Cheat: Count how many times the student leaves the tab during the quiz
  useEffect(() => {
    if (!hasStarted || result) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        alert('⚠️ WARNING: You have left the quiz tab. Your actions are being recorded and multiple violations may result in a score penalty or disqualification.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasStarted, result]);

  function handleNextOrAdvance() {
    const total = quiz.questions.length;
    if (currentQuestion < total - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit(); // Out of questions entirely
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (globalIndex, optionIndex) => {
    const question = quiz.questions[globalIndex];
    setAnswers(prev => {
      const currentSelections = prev[globalIndex] || [];
      let newSelections;
      if (question.multipleCorrect) {
        newSelections = currentSelections.includes(optionIndex)
          ? currentSelections.filter(i => i !== optionIndex)
          : [...currentSelections, optionIndex];
      } else {
        newSelections = [optionIndex];
      }
      return { ...prev, [globalIndex]: newSelections };
    });
  };

  const toggleMarkForReview = (globalIndex) => {
    setMarkedForReview(prev => ({
      ...prev,
      [globalIndex]: !prev[globalIndex]
    }));
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const payload = {
        quizId: id,
        studentName,
        studentIdentifier: studentEmail || 'No Email',
        studentAnswers: answers,
        tabSwitchCount
      };
      const res = await api.post('/results', payload);
      setResult(res.data.data); 
    } catch {
      alert('Failed to submit answers. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-gray-500">Loading Assessment...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-red-500">{error}</div>;

  if (isNotLiveYet && quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Live</h1>
          <p className="text-gray-500 mb-4">This assessment has not started yet.</p>
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg font-bold">
            Starts at: {new Date(quiz.startsAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Closed</h1>
          <p className="text-gray-500">The deadline for this assessment has passed.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-gray-500 mb-8">Great job, {studentName}.</p>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-2">
            <div className="text-sm font-bold text-gray-500 mb-1">Your Score</div>
            <div className="text-5xl font-bold text-indigo-600 mb-2">{result.accuracy}%</div>
            <div className="text-sm font-medium text-gray-600">{result.score} out of {result.totalQuestions} correct</div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#5D1A4A] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#46234D] h-28 border-b-4 border-blue-400 flex items-center justify-center text-4xl">📝</div>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">{quiz.title}</h1>
            <div className="space-y-4 mb-8">
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none" placeholder="Enter Full Name" />
              <input type="text" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none" placeholder="Email / Roll Number" />
            </div>
            <button onClick={() => { if(studentName) setHasStarted(true) }} disabled={!studentName} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50">
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Without sections, currentQuestion is exactly the global index
  const q = quiz.questions[currentQuestion];
  const globalIdx = currentQuestion;
  const selectedOptions = answers[globalIdx] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans select-none">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Main Quiz Content */}
        <div className="flex-1 w-full max-w-4xl">
        
        {/* Header Metadata Tiers */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 truncate max-w-sm">{quiz.title}</h1>
          <div className={`px-4 py-1.5 rounded-lg font-bold text-md shadow-sm border ${
            timeLeft <= 60 ? 'bg-red-100 text-red-600 animate-pulse border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Frame */}
        {q && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </div>
              <button
                onClick={() => toggleMarkForReview(globalIdx)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  markedForReview[globalIdx]
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {markedForReview[globalIdx] ? '🚩 Marked for Review' : '🏳️ Mark for Review'}
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{q.question}</h2>
            
            <div className="space-y-3">
              {q.type === 'Fill in the Blank' ? (
                <div className="mt-4">
                  <input
                    type="text"
                    value={answers[globalIdx]?.[0] || ''}
                    onChange={(e) => {
                      setAnswers(prev => ({ ...prev, [globalIdx]: [e.target.value] }));
                    }}
                    placeholder="Type your answer here..."
                    className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              ) : (
                q.options.map((opt, idx) => {
                  const isSelected = selectedOptions.includes(idx);
                  return (
                    <button 
                      key={idx}
                      onClick={() => handleOptionSelect(globalIdx, idx)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        isSelected ? 'border-indigo-600 bg-indigo-50/50 font-bold' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                        {isSelected && '✓'}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0 || quiz.timerType === 'question'}
            className="px-6 py-2 font-bold text-gray-400 hover:text-gray-700 disabled:opacity-0"
          >
            ← Previous Question
          </button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md">
              Submit Assessment
            </button>
          ) : (
            <button onClick={handleNextOrAdvance} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
              Next Action →
            </button>
          )}
        </div>
        </div>

        {/* Right Column: Question Navigator Grid */}
        <div className="w-full lg:w-[340px] shrink-0 sticky top-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Question Overview
            </div>
            <div className="flex flex-wrap gap-2 max-h-[60vh] overflow-y-auto pr-2 pb-2">
              {quiz.questions.map((question, idx) => {
                const isAnswered = answers[idx] && answers[idx].length > 0 && answers[idx][0] !== '';
                const isMarked = markedForReview[idx];
                const isCurrent = idx === currentQuestion;

                const handleJump = () => {
                  if (quiz.timerType === 'question') return; 
                  setCurrentQuestion(idx);
                };

                let colorClass = 'bg-gray-100 text-gray-500 border-gray-200'; // unanswered
                if (isMarked) colorClass = 'bg-amber-100 text-amber-700 border-amber-400';
                else if (isAnswered) colorClass = 'bg-green-100 text-green-700 border-green-400';

                return (
                  <button
                    key={idx}
                    onClick={handleJump}
                    disabled={quiz.timerType === 'question'}
                    className={`w-9 h-9 rounded-lg border-2 text-xs font-bold flex items-center justify-center transition-all ${colorClass} ${
                      isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                    } ${quiz.timerType === 'question' ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block"></span> Unanswered</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block"></span> Answered</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 inline-block"></span> Marked for Review</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}