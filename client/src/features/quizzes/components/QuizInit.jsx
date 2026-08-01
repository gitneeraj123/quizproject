import { useState } from 'react';
import QuizGeneratorHub from './QuizGeneratorHub';
import PromptGenerator from './PromptGenerator';
import CreateQuiz from './CreateQuiz'; 

export default function QuizInit() {
  // States: 'init' -> 'hub' -> 'prompt' -> 'editor'
  const [currentStep, setCurrentStep] = useState('init'); 
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);

  const handleQuestionsGenerated = (questions) => {
    setAiGeneratedQuestions(questions);
    setCurrentStep('editor');
  };

  const handleCreateManually = () => {
    setAiGeneratedQuestions([]); // Start with zero questions — teacher builds from scratch
    setCurrentStep('editor');
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#F8F9FA] flex flex-col items-center pt-8 pb-12">
      
      {currentStep === 'init' && (
        <div className="text-center mt-24">
          <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Assessment Builder</h1>
          <button 
            onClick={() => setCurrentStep('hub')}
            className="px-8 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 shadow-lg transition-all"
          >
            + Create Assessment
          </button>
        </div>
      )}

      {currentStep === 'hub' && (
        <QuizGeneratorHub 
          onQuestionsGenerated={handleQuestionsGenerated} 
          onSelectPrompt={() => setCurrentStep('prompt')} 
          onCreateManually={handleCreateManually}
        />
      )}

      {currentStep === 'prompt' && (
        <PromptGenerator 
          onGoBack={() => setCurrentStep('hub')}
          onQuestionsGenerated={handleQuestionsGenerated}
        />
      )}

      {currentStep === 'editor' && (
        <div className="w-full max-w-6xl mx-auto px-6">
          <button 
            onClick={() => setCurrentStep('hub')}
            className="mb-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center shadow-sm w-fit"
          >
            <span className="mr-2">←</span> Go Back
          </button>
          
          <CreateQuiz initialAiQuestions={aiGeneratedQuestions} />
        </div>
      )}
    </div>
  );
}