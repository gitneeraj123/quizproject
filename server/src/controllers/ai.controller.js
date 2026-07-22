import extractTextFromPDF from '../utils/pdfHelper.cjs';
import { generateQuizFromText } from '../services/ai.service.js';

/**
 * @desc    Upload a PDF or Text Blob and generate quiz questions
 * @route   POST /api/v1/ai/generate-quiz
 * @access  Private (Teacher/Admin)
 */
export const generateQuiz = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or provide a prompt.' });
    }

    const { gradeLevel = '12th Grade', questionCount = 5 } = req.body;
    let extractedText = '';

    // THE FIX: Check the file type before parsing!
    if (req.file.mimetype === 'text/plain') {
      // It's from the Prompt Generator! Just read the text directly.
      extractedText = req.file.buffer.toString('utf8');
    } else {
      // It's a real PDF! Send it to the pdf-parse helper.
      extractedText = await extractTextFromPDF(req.file.buffer);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Could not read text from this input.' });
    }

    // Limit text to save tokens
    const textSnippet = extractedText.substring(0, 15000); 

    // Send to Groq AI
    const generatedData = await generateQuizFromText(textSnippet, gradeLevel, parseInt(questionCount));

    // Return to React
    res.status(200).json({
      success: true,
      data: generatedData.questions || generatedData // fallback in case Groq returns the array directly
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz from document.' });
  }
};