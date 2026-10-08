import { GoogleGenAI } from "@google/genai";

// Initialize with API key from environment
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate AI response (simple one-shot) with thinking enabled
 */
export async function generateSimpleResponse(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      // Thinking mode is enabled by default, no need to set thinkingBudget: 0
      // Removing config entirely to use defaults (thinking enabled)
    });
    
    // FIXED: Correct way to access response text
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No valid response from AI");
    }
    
    return text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error(error.message || "Failed to generate response");
  }
}

/**
 * Generate AI response with chat history and thinking enabled
 */
export async function generateChatResponse(userMessage, history = []) {
  try {
    // Build the conversation contents
    const contents = [];
    
    // Add history with proper formatting
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      // Thinking mode enabled by default - removed thinkingBudget: 0
      // This allows the AI to use extended thinking for better responses
    });

    // FIXED: Proper response text extraction
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No valid response from AI");
    }
    
    return text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
    throw new Error(error.message || "Failed to generate response");
  }
}

/**
 * Generate AI response with streaming support (optional - for future use)
 */
export async function generateStreamingResponse(userMessage, history = []) {
  try {
    const contents = [];
    
    // Add history
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Return the streaming response
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    return stream;
  } catch (error) {
    console.error("Gemini AI Streaming Error:", error);
    throw new Error(error.message || "Failed to generate streaming response");
  }
}