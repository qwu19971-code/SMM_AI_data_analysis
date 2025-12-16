import { GoogleGenAI } from "@google/genai";
import { SmmLogEntry } from "../types";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set. Gemini features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeUserIntent = async (logs: SmmLogEntry[]): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) return "<p class='text-red-500'>API Key missing. Please configure environment variables.</p>";

  // Sample data: prioritize queries that are long or have feedback
  const interestingLogs = logs
    .filter(l => l.content.length > 5)
    .slice(0, 150) // Analyze a decent sample size
    .map(l => `- [${l.company || 'User'}] asked: "${l.content}"`)
    .join("\n");

  const prompt = `
    You are a Senior Data Analyst for Shanghai Nonferrous Network (SMM). 
    Analyze the following user query logs from our AI Assistant.

    **Data Sample:**
    ${interestingLogs}

    **Task:**
    Provide a professional, concise, and visually appealing analysis of the user behavior.
    
    **IMPORTANT:**
    **ALL OUTPUT MUST BE IN SIMPLIFIED CHINESE (中文).**

    **Analysis Dimensions:**
    1.  **🔍 用户画像 (User Persona)**: Who are they? (e.g., Traders, Analysts) and what defines them?
    2.  **🔥 关注热点 (Hot Topics)**: What specific metals or data points are most requested?
    3.  **💡 策略建议 (Strategic Insights)**: 2-3 specific recommendations for product or content improvement.

    **Output Format:**
    Return **Raw HTML** string. Do not use Markdown. Do not wrap in \`\`\`html tags.
    Use the following Tailwind CSS classes for styling:
    - Headers: \`<h3 class="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2">\` (Add an emoji at the start of the title)
    - Lists: \`<ul class="list-disc pl-5 space-y-2 mb-4 text-slate-600">\`
    - List Items: \`<li>\`
    - Paragraphs: \`<p class="mb-4 text-slate-600 leading-relaxed">\`
    - Keywords/Emphasis: \`<strong class="text-indigo-600 font-semibold">\`
    - Wrapper: Do not include a main wrapper div, just the content.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // Cleanup if model adds backticks despite instructions
    let text = response.text || "";
    text = text.replace(/```html/g, '').replace(/```/g, '');
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "<p class='text-red-500'>生成 AI 分析时出错，请检查控制台。</p>";
  }
};