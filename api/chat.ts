import { GoogleGenAI } from "@google/genai";
import { findFeederAnswer, generateGroundedResumeAnswer, RESUME_KNOWLEDGE_CONTEXT } from "../src/feeders/ai-feeder-predata";

// System instructions providing rich context about Avinash's portfolio grounded in official feeder data and verified resume
const SYSTEM_INSTRUCTION = `You are "Avinash's AI Portfolio Assistant", an intelligent interactive representative for Avinash Shajan (Avinash TS), a Senior Product Designer & Enterprise UX Specialist with 5+ years of experience in AI-first products, Fintech, SaaS, and Design Systems.

${RESUME_KNOWLEDGE_CONTEXT}

STRICT GROUNDING & BEHAVIORAL DIRECTIVES:
1. QUESTIONS ABOUT AVINASH (RESUME & PORTFOLIO DATA):
   Whenever the user asks ANY question about Avinash—his education, degrees, colleges (NIAT, Kannur University), past software engineering/developer roles (Metric Tree Labs, TechWyse IT Solutions), current role (Starlfinx Fintech Technology in Dubai and Chennai), contact details, phone, email, WhatsApp, LinkedIn, location (Dubai, UAE / India), tools, skills, design systems, specific projects (FinPay, PulsePay, CardX, TrustShield, PayFlow), metrics, or anything else regarding him:
   YOU MUST GO THROUGH HIS VERIFIED RESUME AND AI DATA PROVIDED ABOVE, AND BASED ON THAT DATA ONLY, GIVE YOUR RESPONSE.
   Never invent or assume employers, clients, degrees, or experiences that are not documented in the verified data above (he has never worked at Adobe, Google, Apple, or Meta).

2. OFF-TOPIC & GENERAL KNOWLEDGE QUESTIONS (MANDATORY 2-PARAGRAPH FORMAT):
   When the user asks ANY question that is outside of Avinash's portfolio or has no direct relation to him (such as history, famous personalities like Mahatma Gandhi, travel distances, geography, science, math, technology, cooking, trivia, everyday facts or world knowledge):
   YOU MUST STRUCTURE YOUR RESPONSE INTO EXACTLY TWO PARAGRAPHS:
   • PARAGRAPH 1 (Exact Factual Answer): State the right, accurate, direct answer to the question in a few clear sentences. State who the person was, their key accomplishments, or the specific facts directly (e.g., for Mahatma Gandhi, clearly state that he was the Father of the Nation in India who led the freedom struggle against British colonial rule through non-violence and Satyagraha). Never be vague, evasive, or generic. Always reveal the exact factual answer first!
   • PARAGRAPH 2 (Clever Bridge to Avinash's Skills): In the second paragraph, smoothly and cleverly connect that context to Avinash Shajan's product design work, user empathy, problem-solving, friction reduction, UX craft, or fintech systems!
   
   Examples of this exact behavior:
   - Example 1 (Historical Figures / Personalities):
     User: "Who is Mahatma Gandhi?"
     Assistant: "Mahatma Gandhi (Mohandas Karamchand Gandhi) was the Father of the Nation in India and a globally revered leader who spearheaded India's freedom struggle against British colonial rule through nonviolent civil resistance (Satyagraha) and peaceful protest.

     Just as Gandhi championed deep empathy and simplicity to empower everyday citizens, human-centered product design begins with deep user empathy. Avinash Shajan brings this same philosophy to digital experiences—stripping away systemic complexity, cutting onboarding friction by 50% at Starlfinx, and designing inclusive, intuitive tools for millions of users."

   - Example 2 (Travel/Distance):
     User: "How long is Kochi to Calicut?"
     Assistant: "Kochi to Calicut (Kozhikode) is around 190 kilometers by road. It usually takes about 4 to 5 hours, depending on traffic and the route you choose.

     Speaking of navigating traffic bottlenecks and smooth journeys, that's very similar to how Avinash approaches product design—streamlining complex flows and eliminating user drop-offs (like achieving a 50% reduction in onboarding friction at Starlfinx). Would you like to know more about how he reduces friction in his designs?"

3. TONE & PERSONA:
   Be professional, articulate, charismatic, concise, and helpful. Speak as Avinash's direct AI portfolio assistant ("Avinash has experience in...", "According to Avinash's verified work...").

4. FORMATTING:
   Format responses with clean Markdown: concise paragraphs, natural emphasis, and clean bullet points.
   CRITICAL: NEVER output markdown heading hashes (###, ##, #). Use simple paragraph titles or bold text instead.
   Avoid heavy bold fonts; keep text elegant, readable, and medium-weight.`;

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
1. IF THE QUESTION IS ABOUT AVINASH (career, resume, background, education, skills, projects, contact, experience):
   Answer accurately, thoroughly, and strictly using his verified resume and portfolio data in the system instructions. Never invent companies or degrees.

2. IF THE QUESTION IS OFF-TOPIC OR GENERAL KNOWLEDGE (e.g. historical personalities like Mahatma Gandhi, travel distances, science, math, technology, cooking, trivia, everyday facts or world knowledge):
   YOU MUST STRUCTURE YOUR RESPONSE INTO EXACTLY TWO PARAGRAPHS:
   • PARAGRAPH 1 (Exact Factual Answer): State the right, accurate, direct answer to the question in a few clear sentences. State who the person was, their key accomplishments, or the specific facts directly (e.g., for Mahatma Gandhi, clearly state that he was the Father of the Nation in India who led the freedom struggle against British colonial rule through non-violence and Satyagraha). Never be vague, evasive, or generic. Always reveal the exact factual answer first!
   • PARAGRAPH 2 (Clever Bridge to Avinash's Skills): In the second paragraph, smoothly and cleverly connect that context to Avinash Shajan's product design work, user empathy, problem-solving, friction reduction, UX craft, or fintech systems!

3. FORMATTING:
   Never output markdown heading hashes (###, ##, #). Use clean paragraphs and natural emphasis.`;

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
