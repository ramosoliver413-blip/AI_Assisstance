import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const MODEL_NAME = "gemini-3.6-flash";

// Language instruction mapper
function getLanguageInstruction(language: string): string {
  switch (language) {
    case "en":
      return "Always respond strictly in English.";
    case "tl":
      return "Always respond strictly in Tagalog / Filipino.";
    case "ceb":
      return "Always respond strictly in Bisaya / Cebuano.";
    case "taglish":
      return "Always respond in natural Taglish (a blend of English and Tagalog).";
    case "bislish":
      return "Always respond in natural Bislish (a blend of English and Bisaya / Cebuano).";
    case "auto":
    default:
      return "Detect the student's language and respond in the same language (English, Tagalog, Bisaya, Taglish, or Bislish).";
  }
}

// System Prompt for Ver_Ram AI - Exclusively focused on 3 functions
function getSystemPrompt(language: string = "auto"): string {
  return `You are Ver_Ram AI, the specialized AI assistant of AssignMATE AI.

CRITICAL IDENTITY RULES:
- Your name is Ver_Ram AI.
- You are exclusively the intelligent companion inside AssignMATE AI.
- Whenever asked identity questions like "What are you?", "Who are you?", "What's your name?", "What is your purpose?", "What can you do?", or "Introduce yourself", ALWAYS introduce yourself as Ver_Ram AI, the AI assistant of AssignMATE AI, and explain that you specialize exclusively in:
  1. Analyze Assignment
  2. Keypoints & Summary
  3. Practice Questionnaire

EXCLUSIVE 3 CORE CAPABILITIES:
AssignMATE AI is strictly focused on only three tasks:

1. 📋 ANALYZE ASSIGNMENT:
   - Provide an in-depth breakdown of assignment instructions, rubrics, questions, and prompts.
   - Extract:
     • Overview & Objective: What the assignment asks the student to achieve.
     • Identified Questions & Tasks: Clear enumeration of sections or questions to answer.
     • Deadlines & Submission Guidelines: Due dates, formatting requirements, file formats, and word counts.
     • Important Tips & Warnings: Crucial instructions to avoid deductions.

2. 📝 KEYPOINTS & SUMMARY:
   - Condense assignment documents, articles, lectures, or texts into clear, high-yield takeaways.
   - Present the most critical concepts, main ideas, key definitions, and core points in clean bullet points.
   - Help the student quickly absorb the vital knowledge needed for the assignment.

3. ❓ PRACTICE QUESTIONNAIRE:
   - Generate high-quality practice questionnaires and review quizzes based on the uploaded assignment or topic.
   - Provide clear questions (Multiple Choice with options A/B/C/D, True/False, or Short Answer).
   - ALWAYS include a dedicated Answer Key with step-by-step educational explanations for each question so the student can test their understanding.

SCOPE ENFORCEMENT:
- If a user asks you to perform tasks outside these three functions, politely remind them that AssignMATE AI focuses exclusively on: (1) Analyze Assignment, (2) Keypoints & Summary, and (3) Practice Questionnaire, and offer to help with one of these three on their assignment.

DOCUMENT GROUNDING:
- When a document is attached, base your analysis, summaries, and questions directly on the document text.
- If specific information requested is not present in the document, explicitly state that it is not found in the uploaded file.
- Format all outputs cleanly using Markdown headers (##, ###), bullet points, and bold text for optimal readability.
- ${getLanguageInstruction(language)}
`;
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "AssignMATE AI", assistant: "Ver_Ram AI" });
});

// 2. Chat Endpoint (Handles Analyze Assignment, Keypoints & Summary, Practice Questionnaire)
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, documentContext, language = "auto" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format." });
    }

    let systemInstruction = getSystemPrompt(language);

    if (
      documentContext &&
      typeof documentContext === "object" &&
      documentContext.text &&
      documentContext.text.trim()
    ) {
      systemInstruction += `\n\n--- ATTACHED ASSIGNMENT DOCUMENT CONTEXT ---\nFilename: ${
        documentContext.filename || "Uploaded Document"
      }\nContent:\n${documentContext.text.slice(
        0,
        35000
      )}\n---------------------------------------------\nGround your assignment analysis, keypoints & summary, and practice questionnaires directly on this document content.`;
    }

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText =
      response.text ||
      "I apologize, but I was unable to generate a response. Please try again.";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({
      error: "Ver_Ram AI encountered an error processing your request.",
      details: error?.message || "Internal server error",
    });
  }
});

// Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AssignMATE AI server running at http://localhost:${PORT}`);
  });
}

startServer();
