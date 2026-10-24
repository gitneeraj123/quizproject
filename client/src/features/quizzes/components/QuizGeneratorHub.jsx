import { useRef } from 'react';

export default function QuizGeneratorHub({ onFileSelected, onSelectPrompt, onCreateManually }) {
  const fileInputRef = useRef(null);

  // Trigger the hidden file input when "Device" is clicked
  const handleDeviceClick = () => {
    fileInputRef.current.click();
  };

  // The file goes to the settings screen, where grade/difficulty/count are chosen before generating
  const handleFileChosen = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow picking the same file again after going back
    if (file) onFileSelected(file);
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">How would you like to get started?</h1>

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
            onChange={handleFileChosen}
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