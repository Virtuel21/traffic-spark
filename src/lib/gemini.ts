import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the provided Gemini API key by default so keyword categorization
// works out-of-the-box. It can still be overridden via VITE_GEMINI_API_KEY
// at runtime.
const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  "AIzaSyCoPnypnXr5LbLi0G49wg-8eFAhiBU0fDQ";

function fallbackCategorize(keywords: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  keywords.forEach((k) => {
    const topic = k.toLowerCase().split(/\s+/).slice(0, 2).join(" ").trim();
    if (topic) mapping[k] = topic;
  });
  return mapping;
}

export async function categorizeKeywords(keywords: string[]): Promise<Record<string, string>> {
  if (!keywords.length) return {};
  if (!apiKey) return fallbackCategorize(keywords);
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt =
      `Group the following keywords into high-level topics.\n` +
      `Return JSON mapping each keyword to a topic.\n` +
      keywords.map((k) => `- ${k}`).join("\n");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    return json as Record<string, string>;
  } catch (err) {
    console.error("Gemini topic generation failed", err);
    return fallbackCategorize(keywords);
  }
}
