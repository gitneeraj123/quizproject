import { useState } from 'react';
import api from '../../../services/api';

export default function AIQuizGenerator({ onQuestionsGenerated }) {
  const [file, setFile] = useState(null);
  const [gradeLevel, setGradeLevel] = useState('12th Grade');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select a PDF document first.');
      return;
    }

    setLoading(true);
    setError('');

    // We must use FormData to send a file via Axios
    const formData = new FormData();
    formData.append('document', file);
    formData.append('gradeLevel', gradeLevel);
    formData.append('questionCount', questionCount);

    try {
      const response = await api.post('/ai/generate-quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Pass the beautiful JSON array up to the parent editor
      onQuestionsGenerated(response.data.data);
      setFile(null); // Reset after success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-medium text-gray-700">Understanding Document...</h3>
        <p className="text-sm text-gray-500 mt-2">The AI is extracting key concepts and writing your questions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="text-primary mr-2">✨</span> Create with AI
        </h2>
      </div>

      {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Syllabus or Lesson (PDF)</label>
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
          <select 
            value={gradeLevel} 
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
          >
            <option>Middle School</option>
            <option>High School</option>
            <option>12th Grade</option>
            <option>University / College</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Count</label>
          <select 
            value={questionCount} 
            onChange={(e) => setQuestionCount(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
          >
            <option value="5">5 Questions</option>
            <option value="10">10 Questions</option>
            <option value="15">15 Questions</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button 
            onClick={handleGenerate}
            className="w-full py-2 bg-pink-600 text-white font-medium rounded hover:bg-pink-700 transition"
          >
            Generate Questions
          </button>
        </div>
      </div>
    </div>
  );
}