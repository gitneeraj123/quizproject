import { useState } from 'react';
import api from '../../../services/api';

const QUESTION_COUNTS = ['5', '10', '20', '30', '40', '50'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Settings screen for AI generation. Works from either typed text or an uploaded PDF (`file`).
export default function PromptGenerator({ file, onGoBack, onQuestionsGenerated }) {
  const [promptText, setPromptText] = useState('');
  const [gradeLevel, setGradeLevel] = useState('12th Grade');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canGenerate = file || promptText.trim();

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('document', file);
      } else {
        // The AI route reads typed text as a plain-text "document"
        formData.append('document', new Blob([promptText], { type: 'text/plain' }), 'prompt.txt');
      }
      formData.append('gradeLevel', gradeLevel);
      formData.append('questionCount', questionCount);
      formData.append('difficulty', difficulty);

      const response = await api.post('/ai/generate-quiz', formData);
      onQuestionsGenerated(response.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-125">
        <div className="w-16 h-16 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-gray-800">Writing {questionCount} {difficulty.toLowerCase()} questions... ✨</h3>
        <p className="text-gray-500 mt-2">
          {Number(questionCount) > 25 ? 'Large quizzes are generated in batches and can take about a minute.' : 'This usually takes a few seconds.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onGoBack} className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm font-medium text-sm hover:bg-gray-50">
          ← Go Back
        </button>
        <h2 className="text-3xl font-bold text-gray-900">{file ? 'Create from document' : 'Create with prompt or text'}</h2>
        <button onClick={onGoBack} className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center bg-white hover:bg-gray-50">
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        {file ? (
          <div className="flex items-center gap-4">
            <span className="text-4xl">📄</span>
            <div>
              <div className="font-bold text-gray-800">{file.name}</div>
              <div className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </div>
        ) : (
          <textarea
            placeholder="Enter a topic or paste content..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full h-48 outline-none resize-none text-gray-700 text-lg placeholder-gray-400"
          />
        )}
      </div>

      <div className="text-gray-500 font-medium mb-4">Customise your assessment</div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 mb-8">

        <div className="p-4 flex items-center justify-between">
          <span className="text-gray-700">Grade level</span>
          <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 font-medium bg-white">
            <option>Middle School</option>
            <option>10th Grade</option>
            <option>12th Grade</option>
            <option>University</option>
          </select>
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-gray-700">Difficulty</span>
          <div className="flex gap-2">
            {DIFFICULTIES.map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-full border text-sm font-medium ${difficulty === level ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-gray-700">Number of questions</span>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map(num => (
              <button
                key={num}
                onClick={() => setQuestionCount(num)}
                className={`px-4 py-2 rounded-full border text-sm font-medium ${questionCount === num ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="px-8 py-3 bg-gray-200 text-gray-500 font-bold rounded-lg disabled:opacity-50 hover:bg-pink-600 hover:text-white transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
