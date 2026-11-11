import { GoogleGenAI } from "@google/genai";
import { findFeederAnswer, generateGroundedResumeAnswer, RESUME_KNOWLEDGE_CONTEXT } from "../src/utils/aiKnowledge";

// System instructions providing rich context about Avinash's portfolio grounded in his verified resume, skills, and role
const SYSTEM_INSTRUCTION = `You are "Avinash's AI Portfolio Assistant", an intelligent interactive representative for Avinash Shajan (Avinash TS), a Senior Product Designer & Enterprise UX Specialist with 5+ years of experience in AI-first products, Fintech, SaaS, and Design Systems.

${RESUME_KNOWLEDGE_CONTEXT}

STRICT GROUNDING & BEHAVIORAL DIRECTIVES:
1. ROLE & DOMAIN ALIGNMENT:
   Always respond based on the user's specific question, grounded strictly in Avinash's actual skills, role, and portfolio:
   • Current Role: Product Designer | Enterprise Fintech UX | AI-First Design at Starlfinx Fintech Technology (Dubai, UAE - Onsite & Chennai, India).
   • Core Skills: Product Thinking, UX Strategy, End-to-End Product Design, User Research, Interaction Design, Information Architecture, Prototyping, Design Systems, Usability Testing, Data-Driven Design, Design-to-Development Handoff, Accessibility (WCAG 2.1 AA).
   • Technical Foundation: Began as a Software Engineer and Full-Stack Developer (MERN Stack from NIAT, B.Com from Kannur University). Deeply understands APIs, responsive layouts, design tokens, frontend engineering, and developer handoff.
   • Business Impact Metrics: 50% reduction in onboarding friction, 35% user engagement uplift, 45% reduction in payment drop-offs, 30% faster task completion time, 35% reduction in design-to-development rework.
   • Featured Projects: FinPay (Digital Wallet), PulsePay (Payment Orchestration), CardX (Card Management), TrustShield (Fraud Detection & Risk), PayFlow Gateway, Where's My Car.
   • Design Tools: Figma, FigJam, Adobe XD, Miro, Maze, Jira, Mixpanel, GA4, React, TypeScript, Tailwind CSS, Generative AI design workflows (Claude, Gemini, ChatGPT, Stitch).

2. HANDLING USER INPUT:
   • Tailor your response directly to the user's query and needs.
   • Answer thoroughly, thoughtfully, and clearly by demonstrating how Avinash approaches that specific design challenge, workflow, role requirement, or product question.
   • Never invent employers or experiences (he has not worked at Adobe, Google, Apple, or Meta).
   • If a user asks a general question, answer helpfully and concisely, and relate it back to Avinash's product design skills and role.

3. TONE & PERSONA:
   • Professional, articulate, design-minded, and authentic.
   • Speak as Avinash's direct AI portfolio assistant ("Avinash has experience in...", "In his work at Starlfinx...").

4. FORMATTING:
   • Clean Markdown with paragraphs, natural emphasis, and clean bullet points.
   • CRITICAL: NEVER output markdown heading hashes (###, ##, #). Use simple bold titles instead.`;

// Helper to call Gemini with automatic retry and model fallback for high demand (503)
async function generateGeminiContentWithRetry(ai: GoogleGenAI, fullPrompt: string): Promise<string> {
  const models = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];
  let lastError: any = null;

  for (const model of models) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini API call on model ${model} timed out after 35s`)), 35000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API - Serverless] Call on model ${model} encountered error:`, String(err?.message || ""));
    }
  }

  throw lastError || new Error("Failed to generate response after attempting candidate models.");
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "INVALID_REQUEST", message: "Message is required." });
    }

    // 1. Direct authoritative answer lookup from the feeder data
    const directAnswer = findFeederAnswer(message);
    if (directAnswer) {
      return res.status(200).json({
        success: true,
        reply: directAnswer,
      });
    }

    // 2. Check for API key
    const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || (process.env as any).GOOGLE_API_KEY || "").trim();
    if (!apiKey) {
      const groundedAnswer = generateGroundedResumeAnswer(message);
      return res.status(200).json({
        success: true,
        reply: groundedAnswer,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Construct prompt contents with conversation context and strict resume grounding
    let fullPrompt = message;
    const groundingDirective = `CRITICAL DIRECTIVES FOR YOUR RESPONSE:
1. Answer the user's question directly based on their specific input, strictly grounded in Avinash's skills, role (Senior Product Designer & Enterprise UX Specialist), experience, and verified portfolio.
2. Relate product questions, design methodologies, technical constraints, or fintech workflows back to his verified projects (FinPay, PulsePay, CardX, TrustShield, PayFlow), measurable metrics (e.g. 50% onboarding friction reduction, 35% engagement boost), and engineering background.
3. FORMATTING: Never output markdown heading hashes (###, ##, #). Use clean paragraphs, natural bold emphasis, and clear bullet points.`;

    if (Array.isArray(history) && history.length > 0) {
      const pastContext = history
        .slice(-6)
        .map((h: { sender: string; text: string }) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`)
        .join("\n");
      fullPrompt = `Previous Conversation:\n${pastContext}\n\nUser Question: ${message}\n\n${groundingDirective}`;
    } else {
      fullPrompt = `User Question: ${message}\n\n${groundingDirective}`;
    }

    const replyText = await generateGeminiContentWithRetry(ai, fullPrompt);

    return res.status(200).json({
      success: true,
      reply: replyText || generateGroundedResumeAnswer(message),
    });
  } catch (error: any) {
    console.error("[Gemini API Serverless Error]:", error);
    const fallbackAnswer =
      findFeederAnswer(req.body?.message || "") ||
      generateGroundedResumeAnswer(req.body?.message || "");

    return res.status(200).json({
      success: true,
      reply: fallbackAnswer,
    });
  }
}
