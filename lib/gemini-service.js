const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * @param {string} base64Image
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function analyzeWithGemini(base64Image, prompt) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const imageData = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, imageData] }],
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}

module.exports = { analyzeWithGemini };