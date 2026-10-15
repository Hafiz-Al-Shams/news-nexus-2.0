// src>lib>gemini.js  (MODIFIED)
import { GoogleGenAI } from "@google/genai";

// Initialize with API key from environment
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-2.5-flash";

// Safely reads the answer text: joins all text parts and ignores "thought" parts (the model's internal thinking)
function extractText(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => typeof part.text === "string" && !part.thought) // skip thought parts and non-text parts
    .map((part) => part.text)
    .join("")
    .trim();
}

// Turns the optional settings into a Gemini "config" object (only the settings that were passed)
function buildConfig({ systemInstruction, maxOutputTokens, temperature, thinkingBudget } = {}) {
  const config = {};
  if (systemInstruction) config.systemInstruction = systemInstruction; // the hidden "job description"
  if (typeof maxOutputTokens === "number") config.maxOutputTokens = maxOutputTokens; // cap the answer length
  if (typeof temperature === "number") config.temperature = temperature; // lower = more factual
  if (typeof thinkingBudget === "number") config.thinkingConfig = { thinkingBudget }; // 0 = thinking off
  return config;
}

// Builds the "contents" array from the history + the new message
function buildContents(userMessage, history) {
  const contents = [];

  for (const msg of history) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({ role: "user", parts: [{ text: userMessage }] });
  return contents;
}

/**
 * Generate AI response (simple one-shot), default settings (unchanged behavior)
 */
export async function generateSimpleResponse(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = extractText(response);
    if (!text) throw new Error("No valid response from AI");

    return text;
  } catch (error) {
    console.error("Gemini AI Error:", error.message);
    throw new Error(error.message || "Failed to generate response");
  }
}

/**
 * Generate AI response with chat history.
 * options (all optional): { systemInstruction, maxOutputTokens, temperature, thinkingBudget }
 * Called without options it behaves like before.
 */
export async function generateChatResponse(userMessage, history = [], options = {}) {
  try {
    const config = buildConfig(options);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildContents(userMessage, history),
      ...(Object.keys(config).length > 0 && { config }), // only send config when something was set
    });

    const text = extractText(response);
    if (!text) throw new Error("No valid response from AI"); // e.g. blocked or empty answer

    return text;
  } catch (error) {
    console.error("Gemini AI Error:", error.message); // message only: no full error dump in the logs
    throw new Error(error.message || "Failed to generate response");
  }
}

/**
 * Generate AI response with streaming support (optional - for future use)
 */
export async function generateStreamingResponse(userMessage, history = [], options = {}) {
  try {
    const config = buildConfig(options);

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: buildContents(userMessage, history),
      ...(Object.keys(config).length > 0 && { config }),
    });

    return stream;
  } catch (error) {
    console.error("Gemini AI Streaming Error:", error.message);
    throw new Error(error.message || "Failed to generate streaming response");
  }
}