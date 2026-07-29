import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function CreateQuiz({ initialAiQuestions = [] }) {
  const [questions, setQuestions] = useState([]);
  const [uiState, setUiState] = useState('list'); 
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState(null);

  const [isPublishing, setIsPublishing] = useState(false); 

  const [publishForm, setPublishForm] = useState({
    title: 'Exploring the World of AI',
    subject: 'Computer Science',
    grade: '12th Grade',
    visibility: 'Restricted',
    coverImage: null,
    timerType: 'session', 
    expiresAt: ''         
  });
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (initialAiQuestions && initialAiQuestions.length > 0) {
      const formatted = initialAiQuestions.map((q) => ({
        question: q.question,
        imageUrl: null,
        options: q.options.map(opt => {
          const optionText = typeof opt === 'string' ? opt : (opt.text || 'Untitled Option');
          return { text: optionText, imageUrl: null };
        }),
        correctAnswers: q.correctAnswers 
          ? q.correctAnswers 
          : (q.correctAnswer !== undefined ? [q.correctAnswer] : [0]),
        multipleCorrect: false,
        timeLimit: 1,
        points: 1,
        type: 'Multiple Choice'
      }));
      setQuestions(formatted);
    }
  }, [initialAiQuestions]);

  const handleStartNewQuestion = (type) => {
    let defaultOptions = [
      { text: '', imageUrl: null }, { text: '', imageUrl: null }, 
      { text: '', imageUrl: null }, { text: '', imageUrl: null }
    ];
    
    if (type === 'True or False') {
      defaultOptions = [{ text: 'True', imageUrl: null }, { text: 'False', imageUrl: null }];
    } else if (type === 'Fill in the Blank') {
      defaultOptions = [{ text: '', imageUrl: null }]; 
    }

    setEditIndex(null);
    setEditData({
      question: '',
      imageUrl: null,
      options: defaultOptions,
      correctAnswers: [0],
      multipleCorrect: false,
      timeLimit: 1,
      points: 1,
      type: type
    });
    setUiState('editing');
  };

  const handleEditQuestion = (index) => {
    setEditIndex(index);
    setEditData({ ...questions[index] });
    setUiState('editing');
  };

  const handleSaveQuestion = () => {
    if (editIndex !== null) {
      const updated = [...questions];
      updated[editIndex] = editData;
      setQuestions(updated);
    } else {
      setQuestions([...questions, editData]);
    }
    setUiState('list');
  };

  const toggleCorrectAnswer = (idx) => {
    if (editData.type === 'Fill in the Blank') return; 
    
    if (editData.multipleCorrect) {
      setEditData({
        ...editData,
        correctAnswers: editData.correctAnswers.includes(idx)
          ? editData.correctAnswers.filter(i => i !== idx)
          : [...editData.correctAnswers, idx]
      });
    } else {
      setEditData({ ...editData, correctAnswers: [idx] });
    }
  };

  const handleToggleMultipleCorrect = () => {
    const isNowMultiple = !editData.multipleCorrect;
    setEditData({
      ...editData,
      multipleCorrect: isNowMultiple,
      correctAnswers: isNowMultiple ? editData.correctAnswers : [editData.correctAnswers[0] || 0]
    });
  };

  const handleImageUpload = async (e, target, optIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = response.data.data.url;
      
      if (target === 'question') {
        setEditData({ ...editData, imageUrl: url });
      } else if (target === 'option') {
        const newOpts = [...editData.options];
        newOpts[optIndex].imageUrl = url;
        setEditData({ ...editData, options: newOpts });
      } else if (target === 'cover') {
        setPublishForm({ ...publishForm, coverImage: url });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    }
  };



  const handleFinalPublish = async () => {
    setIsPublishing(true);
    try {
      const validQuestions = questions.filter(q => q.question && q.question.trim() !== '');

      if (validQuestions.length === 0) {
        alert('You must have at least one valid question to publish this assessment.');
        setIsPublishing(false);
        return;
      }

      const quizPayload = {
        title: publishForm.title,
        subject: publishForm.subject,
        grade: publishForm.grade,
        visibility: publishForm.visibility,
        coverImage: publishForm.coverImage,
        timerType: publishForm.timerType, 
        expiresAt: publishForm.expiresAt || null, 
        questions: validQuestions 
      };

      const response = await api.post('/quizzes', quizPayload);
      const newQuizId = response.data.data._id;

      setGeneratedLink(`http://localhost:5173/take-quiz/${newQuizId}`);
      setUiState('published');
    } catch (error) {
      console.error('Failed to publish quiz to database:', error);
      alert('Error publishing quiz. Please check your backend connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (uiState === 'selectType') {
    return (
      <div className="max-w-5xl mx-auto mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-8 min-h-150">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create new question</h2>
          <button onClick={() => setUiState('list')} className="text-gray-400 hover:text-gray-800 text-xl">✕</button>
        </div>
        


        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Create with question type</h3>
          <div className="grid grid-cols-3 gap-6">
            <button onClick={() => handleStartNewQuestion('Multiple Choice')} className="flex items-center gap-3 p-3 border border-transparent hover:border-pink-200 hover:bg-pink-50 rounded-lg transition-colors text-left">
              <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center text-white font-bold">✓</div>
              <span className="font-bold text-gray-700">Multiple Choice</span>
            </button>
            <button onClick={() => handleStartNewQuestion('True or False')} className="flex items-center gap-3 p-3 border border-transparent hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-colors text-left">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">T/F</div>
              <span className="font-bold text-gray-700">True or False</span>
            </button>
            <button onClick={() => handleStartNewQuestion('Fill in the Blank')} className="flex items-center gap-3 p-3 border border-transparent hover:border-green-200 hover:bg-green-50 rounded-lg transition-colors text-left">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">_</div>
              <span className="font-bold text-gray-700">Fill in the Blank</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uiState === 'editing' && editData) {
    const bgColors = ['bg-[#2D70B3]', 'bg-[#219E9C]', 'bg-[#ECA82A]', 'bg-[#D64F5D]'];
    
    return (
      <div className="max-w-6xl mx-auto mt-4 bg-white border-2 border-pink-100 rounded-xl shadow-lg min-h-175 flex flex-col relative overflow-hidden">
        {editIndex !== null && (
          <div className="bg-pink-500 text-white text-center py-1 text-xs font-bold uppercase tracking-widest">
            Currently Editing Question {editIndex + 1}
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setUiState('list')} className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-bold">←</button>
            <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded uppercase">{editData.type}</span>
          </div>
          <div className="flex items-center gap-4">
            <select value={editData.points} onChange={e => setEditData({...editData, points: parseInt(e.target.value)})} className="border border-gray-300 rounded px-2 py-1 text-sm font-medium outline-none">
              {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} point{i>0?'s':''}</option>)}
            </select>
            <select value={editData.timeLimit} onChange={e => setEditData({...editData, timeLimit: parseInt(e.target.value)})} className="border border-gray-300 rounded px-2 py-1 text-sm font-medium outline-none">
              {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} min{i>0?'s':''}</option>)}
            </select>
            <button onClick={handleSaveQuestion} className="px-6 py-2 bg-[#6E42C1] text-white rounded-lg text-sm font-bold hover:bg-purple-800 transition-colors">
              💾 Save question
            </button>
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex-1 flex justify-center items-start">
          <div className="w-full max-w-4xl bg-[#4A2B4D] rounded-xl p-4 shadow-lg border border-purple-900/50">
            <div className="bg-[#2D1B36] rounded-t-lg p-8 min-h-40 relative flex flex-col items-center justify-center">
               {editData.imageUrl && <img src={editData.imageUrl} alt="Question" className="max-h-32 mb-4 rounded border border-white/20" />}
               <textarea 
                  value={editData.question}
                  onChange={(e) => setEditData({...editData, question: e.target.value})}
                  placeholder="Type question here"
                  className="w-full h-full bg-transparent text-white text-2xl outline-none resize-none placeholder-gray-400 text-center"
               />
               <label className="absolute bottom-4 right-4 text-gray-400 hover:text-white bg-white/10 px-3 py-1 rounded text-sm cursor-pointer transition-colors">
                  🖼️ Add Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'question')} />
               </label>
            </div>

            {editData.type === 'Fill in the Blank' ? (
              <div className="bg-[#219E9C] rounded-b-lg p-6 mt-2 min-h-35 flex items-center justify-center">
                 <input 
                    type="text" 
                    value={editData.options[0].text}
                    onChange={(e) => {
                      const newOpts = [...editData.options];
                      newOpts[0].text = e.target.value;
                      setEditData({...editData, options: newOpts});
                    }}
                    placeholder="Type the exact correct answer here"
                    className="w-full max-w-md bg-white/20 text-white text-center text-xl p-3 rounded outline-none placeholder-white/70 border border-white/30 focus:bg-white/30 transition-colors"
                 />
              </div>
            ) : (
              <div className={`grid gap-2 mt-2 ${editData.type === 'True or False' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                {editData.options.map((opt, idx) => (
                  <div key={idx} className={`${bgColors[idx % 4]} rounded-b-lg p-4 min-h-35 flex flex-col relative`}>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-white/50 hover:text-white cursor-pointer">
                        🖼️ <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'option', idx)} />
                      </label>
                      <button 
                        onClick={() => toggleCorrectAnswer(idx)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${editData.correctAnswers.includes(idx) ? 'bg-green-500 border-green-500 text-white scale-110' : 'border-white/50 text-transparent hover:border-white'}`}
                      >✓</button>
                    </div>
                    {opt.imageUrl && <img src={opt.imageUrl} alt="Option" className="h-16 object-contain mb-2 rounded" />}
                    <textarea 
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editData.options];
                        newOpts[idx].text = e.target.value;
                        setEditData({...editData, options: newOpts});
                      }}
                      placeholder="Type answer here"
                      readOnly={editData.type === 'True or False'}
                      className={`w-full bg-transparent text-white text-center text-sm outline-none resize-none placeholder-white/70 flex-1 ${editData.type === 'True or False' ? 'text-2xl font-bold font-sans' : ''}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {editData.type === 'Multiple Choice' && (
              <div className="flex justify-between items-center mt-6 px-2 text-white">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  Multiple correct answers:
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${editData.multipleCorrect ? 'bg-green-500' : 'bg-white/20'}`} onClick={handleToggleMultipleCorrect}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${editData.multipleCorrect ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (uiState === 'publishing') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-pink-500">⚙️</span> Quiz settings</h2>
            <button onClick={() => setUiState('list')} className="text-gray-400 hover:text-gray-800 text-2xl">✕</button>
          </div>
          
          <div className="flex p-8 gap-8">
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                <input type="text" value={publishForm.title} onChange={e => setPublishForm({...publishForm, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-medium outline-none focus:border-pink-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <select value={publishForm.subject} onChange={e => setPublishForm({...publishForm, subject: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-medium outline-none">
                    <option>Computer Science</option>
                    <option>Mathematics</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
                  <select value={publishForm.grade} onChange={e => setPublishForm({...publishForm, grade: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-medium outline-none">
                    <option>10th Grade</option>
                    <option>12th Grade</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Timer Mode</label>
                  <select value={publishForm.timerType} onChange={e => setPublishForm({...publishForm, timerType: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-medium outline-none">
                    <option value="session">Overall Assessment Timer</option>
                    <option value="question">Per-Question Timer</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Deadline / Expiry (Optional)</label>
                  <input type="datetime-local" value={publishForm.expiresAt} onChange={e => setPublishForm({...publishForm, expiresAt: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-medium outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Visibility</label>
                <select value={publishForm.visibility} onChange={e => setPublishForm({...publishForm, visibility: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3 font-medium outline-none">
                  <option value="Restricted">Restricted (Visible only by you)</option>
                  <option value="Public">Public (Visible in Assessment library)</option>
                </select>
              </div>
            </div>
            
            <label className="w-72 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-400 transition-all cursor-pointer relative overflow-hidden">
              {publishForm.coverImage ? (
                <img src={publishForm.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-400 text-white rounded flex items-center justify-center text-2xl mb-2">+</div>
                  <span className="font-medium text-sm text-gray-500">Add cover image</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
            </label>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-gray-50">
            <button onClick={() => setUiState('list')} disabled={isPublishing} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-white disabled:opacity-50">Cancel</button>
            <button onClick={handleFinalPublish} disabled={isPublishing} className="px-8 py-2 bg-pink-600 rounded-lg font-bold text-white hover:bg-pink-700 flex items-center gap-2 disabled:opacity-50">
              {isPublishing ? 'Publishing...' : '💾 Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uiState === 'published') {
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); 
      } catch (err) {
        console.error('Failed to copy!', err);
        const textArea = document.createElement("textarea");
        textArea.value = generatedLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    };

    return (
      <div className="max-w-2xl mx-auto mt-24 bg-white border border-gray-200 rounded-2xl shadow-xl p-12 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Published!</h2>
        <p className="text-gray-500 mb-8">"{publishForm.title}" has been saved to your library and is ready for students.</p>
        
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between mb-8">
          <span className="text-gray-700 font-mono text-sm truncate mr-4">{generatedLink}</span>
          <button 
            onClick={handleCopyLink}
            className={`px-6 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${isCopied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
          >
            {isCopied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        <button onClick={() => setUiState('list')} className="text-pink-600 font-bold hover:underline">
          ← Back to Editor
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-8 w-full mt-4 pb-24 max-w-5xl mx-auto">
      <div className="flex-1">
        
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="font-bold text-gray-800 text-lg flex items-center gap-4">
            <span>{publishForm.title}</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{questions.length} Questions</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setUiState('publishing')} className="px-6 py-2 bg-pink-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-pink-700 flex items-center gap-2 transition-transform hover:scale-105">
              🚀 Publish
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end mb-6">
          <button onClick={() => setUiState('selectType')} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm">
            <span className="text-pink-500">+</span> Create question
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded uppercase tracking-wider">{q.type}</span>
                  <span className="text-xs font-medium text-gray-500 border border-gray-200 bg-white px-2 py-1 rounded">{q.timeLimit} min</span>
                  <span className="text-xs font-medium text-gray-500 border border-gray-200 bg-white px-2 py-1 rounded">{q.points} Pt</span>
                </div>
                
                <div className="flex items-center gap-4 text-gray-400">
                  <button onClick={() => handleEditQuestion(index)} className="hover:text-blue-600 font-medium text-sm flex items-center gap-1">✏️ Edit</button>
                  <button onClick={() => setQuestions(questions.filter((_, i) => i !== index))} className="hover:text-red-500 font-medium text-sm flex items-center gap-1">🗑️ Delete</button>
                </div>
              </div>

              <div className="p-5">
                {q.imageUrl && <img src={q.imageUrl} alt="Q" className="max-h-24 mb-3 rounded" />}
                <h3 className="font-bold text-gray-900 text-lg mb-4">{q.question}</h3>
                
                {q.type === 'Fill in the Blank' ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 font-mono text-sm inline-block">
                    Exact Match: <strong>{q.options[0].text}</strong>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${q.type === 'True or False' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-100">
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${q.correctAnswers.includes(optIndex) ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                          {q.correctAnswers.includes(optIndex) && <span className="text-xs">✓</span>}
                        </div>
                        {opt.imageUrl && <img src={opt.imageUrl} alt="opt" className="h-8 rounded" />}
                        <span className="text-gray-700 text-sm font-medium">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 font-medium">
              No questions yet. Click "Create question" above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}