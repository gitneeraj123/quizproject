import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Generate 2 questions in JSON. Use JSON object format.' }],
      model: "llama-3.1-8b-instant", 
      temperature: 0.3,
      max_tokens: 6000,
      response_format: { type: "json_object" }
    });
    console.log(chatCompletion.choices[0]?.message?.content);
  } catch (err) {
    console.error("GROQ ERROR:", err);
  }
}
test();
