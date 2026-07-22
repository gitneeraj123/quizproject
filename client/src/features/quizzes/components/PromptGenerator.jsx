import { useState } from 'react';
import api from '../../../services/api';

export default function PromptGenerator({ onGoBack, onQuestionsGenerated }) {
  const [promptText, setPromptText] = useState('');
  const [gradeLevel, setGradeLevel] = useState('12th Grade');
  const [questionCount, setQuestionCount] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);

    try {
      // For the hackathon, we send the prompt to your existing AI route
      // We wrap it in a mock PDF buffer structure, or you can create a dedicated text-only route later!
      const formData = new FormData();
      const blob = new Blob([promptText], { type: 'text/plain' });
      formData.append('document', blob, 'prompt.txt');
      formData.append('gradeLevel', gradeLevel);
      formData.append('questionCount', questionCount);

      const response = await api.post('/ai/generate-quiz', formData);
      onQuestionsGenerated(response.data.data);
    } catch (err) {
      console.error(err);
      alert("Generation failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-24 text-center font-bold text-xl text-gray-700">Writing Questions... ✨</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onGoBack} className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm font-medium text-sm hover:bg-gray-50">
          ← Go Back
        </button>
        <h2 className="text-3xl font-bold text-gray-900">Create with prompt or text</h2>
        <button onClick={onGoBack} className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center bg-white hover:bg-gray-50">
          ✕
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        <textarea 
          placeholder="Enter a topic or paste content..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="w-full h-48 outline-none resize-none text-gray-700 text-lg placeholder-gray-400"
        />
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
          <span className="text-gray-700">Number of questions</span>
          <div className="flex gap-2">
            {['Automatic', '5', '10', '15', '20'].map(num => (
              <button 
                key={num}
                onClick={() => setQuestionCount(num === 'Automatic' ? '10' : num)}
                className={`px-4 py-2 rounded-full border text-sm font-medium ${questionCount === num || (num === 'Automatic' && questionCount === '10') ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
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
          disabled={!promptText.trim()}
          className="px-8 py-3 bg-gray-200 text-gray-500 font-bold rounded-lg disabled:opacity-50 hover:bg-pink-600 hover:text-white transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}