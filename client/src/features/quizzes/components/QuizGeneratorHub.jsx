import { useState, useRef } from 'react';
import api from '../../../services/api';

export default function QuizGeneratorHub({ onQuestionsGenerated, onSelectPrompt, onCreateManually }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Trigger the hidden file input when "Device" is clicked
  const handleDeviceClick = () => {
    fileInputRef.current.click();
  };

  // Handle the actual file upload to your backend
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('gradeLevel', '12th Grade'); 
    formData.append('questionCount', 5);

    try {
      const response = await api.post('/ai/generate-quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Pass the generated questions up to the parent to move to the next screen!
      onQuestionsGenerated(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions. Check console.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-125">
        <div className="w-16 h-16 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-gray-800">Understanding Document...</h3>
        <p className="text-gray-500 mt-2">Extracting key concepts using AI</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">How would you like to get started?</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Two-Column Grid for a balanced, clean UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Device File Upload */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center shadow-sm hover:border-[#00B4D8] transition-colors flex flex-col justify-center items-center h-72">
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            Upload lesson slides or <br/><span className="underline decoration-2 underline-offset-4 decoration-[#00B4D8]">any document</span>
          </h2>
          <p className="text-sm text-gray-500 mb-8">PDF files up to 10 MB</p>
          
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          
          <button 
            onClick={handleDeviceClick}
            className="flex items-center px-8 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
          >
            <span className="mr-3 text-xl">⬆️</span> Upload from Device
          </button>
        </div>

        {/* Right Column: AI Prompt Generation */}
        <div 
          onClick={onSelectPrompt} // ADD THIS LINE
          className="bg-white border-2 border-gray-100 rounded-2xl p-10 shadow-sm hover:border-[#00B4D8] hover:shadow-md transition cursor-pointer flex flex-col justify-center h-72"
        >
          <h3 className="font-bold text-gray-800 text-xl mb-3">
            Create with prompt or text
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Type a topic (e.g. "React JS Hooks") and let our AI generate a complete assessment instantly.
          </p>
          <div className="relative mt-auto">
            <span className="absolute left-4 top-3 text-gray-400">✨</span>
            <input 
              type="text" 
              placeholder="Enter a topic..." 
              readOnly // Make it read-only so clicking it just triggers the screen swap
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer"
            />
          </div>
        </div>

        {/* Third Column: Manual Creation */}
        <div 
          onClick={onCreateManually}
          className="bg-white border-2 border-gray-100 rounded-2xl p-10 shadow-sm hover:border-[#00B4D8] hover:shadow-md transition cursor-pointer flex flex-col justify-center items-center text-center h-72"
        >
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="font-bold text-gray-800 text-xl mb-3">
            Create manually
          </h3>
          <p className="text-sm text-gray-500">
            Skip AI and build your quiz question-by-question from a blank assessment.
          </p>
        </div>

      </div>
    </div>
  );
}