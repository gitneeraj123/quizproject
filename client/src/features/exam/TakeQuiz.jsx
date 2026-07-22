/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function TakeQuiz() {
  const { id } = useParams(); 
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // --- SECTIONS & QUESTION STATE ---
  const [sections, setSections] = useState([]); // Array of section names
  const [activeSection, setActiveSection] = useState(''); // Currently clicked tab
  const [currentQuestion, setCurrentQuestion] = useState(0); // Index relative to current section
  const [answers, setAnswers] = useState({}); // Unique map key format: "globalIndex": [selections]
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // 1. Fetch Assessment Data & Map Sections
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/quizzes/${id}/student`);
        const quizData = res.data.data;
        
        if (quizData.expiresAt && new Date() > new Date(quizData.expiresAt)) {
          setIsExpired(true);
        }
        
        // Extract unique section names from questions array
        const uniqueSections = Array.from(
          new Set(quizData.questions.map(q => q.section || 'General Focus'))
        );
        
        setQuiz(quizData);
        setSections(uniqueSections);
        setActiveSection(uniqueSections[0] || '');
        setLoading(false);
      } catch (err) {
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
        const currentGlobalQ = getFilteredQuestions()[currentQuestion];
        const currentQTime = currentGlobalQ?.timeLimit || 1;
        setTimeLeft(currentQTime * 60);
      } else if (timeLeft === null) {
        const totalMinutes = quiz.questions.reduce((sum, q) => sum + (q.timeLimit || 1), 0);
        setTimeLeft(totalMinutes * 60);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, quiz, currentQuestion, activeSection]);

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

  // Helper to get questions belonging to the active section tab
  const getFilteredQuestions = () => {
    if (!quiz) return [];
    return quiz.questions.map((q, originalIdx) => ({ ...q, originalIdx }))
                         .filter(q => (q.section || 'General Focus') === activeSection);
  };

  const handleNextOrAdvance = () => {
    const filtered = getFilteredQuestions();
    if (currentQuestion < filtered.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // If last question in section, check if there's a next section tab
      const currentSectionIdx = sections.indexOf(activeSection);
      if (currentSectionIdx < sections.length - 1) {
        setActiveSection(sections[currentSectionIdx + 1]);
        setCurrentQuestion(0);
      } else {
        handleSubmit(); // Out of questions entirely
      }
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        quizId: id,
        studentName,
        studentIdentifier: studentEmail || 'No Email',
        studentAnswers: answers
      };
      const res = await axios.post('http://localhost:5000/api/v1/results', payload);
      setResult(res.data.data); 
    } catch (err) {
      alert('Failed to submit answers. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-gray-500">Loading Section Quiz...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-red-500">{error}</div>;

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

  const activeQuestions = getFilteredQuestions();
  const q = activeQuestions[currentQuestion];
  const globalIdx = q?.originalIdx;
  const selectedOptions = answers[globalIdx] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Metadata Tiers */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 truncate max-w-sm">{quiz.title}</h1>
          <div className={`px-4 py-1.5 rounded-lg font-bold text-md shadow-sm border ${
            timeLeft <= 60 ? 'bg-red-100 text-red-600 animate-pulse border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* 🔥 DYNAMIC SECTION TABS */}
        <div className="flex border-b border-gray-200 gap-2 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          {sections.map((secName) => (
            <button
              key={secName}
              onClick={() => {
                if (quiz.timerType !== 'question') { // Lock tab swapping if strict per-question timing is active
                  setActiveSection(secName);
                  setCurrentQuestion(0);
                }
              }}
              disabled={quiz.timerType === 'question'}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all ${
                activeSection === secName 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' 
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              } ${quiz.timerType === 'question' ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {secName}
            </button>
          ))}
        </div>

        {/* Question Frame */}
        {q && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">
              Question {currentQuestion + 1} of {activeQuestions.length} inside {activeSection}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{q.question}</h2>
            
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
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
              })}
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0 || quiz.timerType === 'question'}
            className="px-6 py-2 font-bold text-gray-400 hover:text-gray-700 disabled:opacity-0"
          >
            ← Previous Question
          </button>

          {currentQuestion === activeQuestions.length - 1 && sections.indexOf(activeSection) === sections.length - 1 ? (
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
    </div>
  );
}