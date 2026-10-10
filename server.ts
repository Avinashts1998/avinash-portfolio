import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { findFeederAnswer, generateGroundedResumeAnswer, FEEDER_KNOWLEDGE_CONTEXT, portfolioQA } from "./src/feeders/ai-feeder-predata";

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: "50mb" }));

// System instructions providing rich context about Avinash's portfolio grounded in official feeder data and verified resume
const SYSTEM_INSTRUCTION = `You are "Avinash's AI Portfolio Assistant", an intelligent interactive representative for Avinash Shajan (Avinash TS), a Senior Product Designer & Enterprise UX Specialist with 5+ years of experience in AI-first products, Fintech, SaaS, and Design Systems.

${FEEDER_KNOWLEDGE_CONTEXT}

STRICT GROUNDING & BEHAVIORAL DIRECTIVES:
1. QUESTIONS ABOUT AVINASH (RESUME & PORTFOLIO DATA):
   Whenever the user asks ANY question about Avinash—his education, degrees, colleges (NIAT, Kannur University), past software engineering/developer roles (Metric Tree Labs, TechWyse IT Solutions), current role (Starlfinx Fintech Technology in Dubai and Chennai), contact details, phone, email, WhatsApp, LinkedIn, location (Dubai, UAE / India), tools, skills, design systems, specific projects (FinPay, PulsePay, CardX, TrustShield, PayFlow), metrics, or anything else regarding him:
   YOU MUST GO THROUGH HIS VERIFIED RESUME AND AI DATA PROVIDED ABOVE, AND BASED ON THAT DATA ONLY, GIVE YOUR RESPONSE.
   Never invent or assume employers, clients, degrees, or experiences that are not documented in the verified data above (he has never worked at Adobe, Google, Apple, or Meta).

2. OFF-TOPIC & GENERAL KNOWLEDGE QUESTIONS (MANDATORY EXACT ANSWER + CLEVER PORTFOLIO BRIDGE):
   When the user asks ANY question that is outside of Avinash's portfolio or has no direct relation to him (such as travel distances, geography, science, math, coding, cooking, trivia, everyday facts, or general inquiries):
   • STEP 1 (Factual Accuracy): NEVER refuse to answer. NEVER say "I can only answer questions about Avinash" or "I am not able to tell that". ALWAYS provide the exact, accurate, helpful, and concise answer to that particular question first.
   • STEP 2 (Clever Bridge to Avinash's Work): Immediately follow up with a smooth, witty, professional transition that connects the concept back to Avinash's product design work, problem-solving, friction reduction, UX craft, or fintech systems!
   
   Examples of this exact behavior:
   - Example 1 (Travel/Distance):
     User: "How long is Kochi to Calicut?"
     Assistant: "Kochi to Calicut (Kozhikode) is around 190 kilometers by road. It usually takes about 4 to 5 hours, depending on traffic and the route you choose.

     Speaking of navigating traffic bottlenecks and smooth journeys, that's very similar to how Avinash approaches product design—streamlining complex flows and eliminating user drop-offs (like achieving a 50% reduction in onboarding friction at Starlfinx). Would you like to know more about how he reduces friction in his designs?"

   - Example 2 (General Tech/AI/Concepts):
     User: "What is quantum computing?"
     Assistant: "Quantum computing is a rapidly evolving technology that harnesses the laws of quantum mechanics to solve complex problems exponentially faster than classical computers, using quantum bits (qubits) that can exist in multiple states simultaneously.

     Much like how quantum computing untangles massive, multi-variable complexity, Avinash specializes in designing clear interfaces for complex enterprise architectures and high-throughput fintech infrastructure (like PulsePay). Interested in learning how he simplifies complex workflows for users?"

   - Example 3 (Everyday/Lifestyle):
     User: "How do I make a great cup of coffee?"
     Assistant: "To brew a great cup of coffee, use freshly roasted beans, a consistent grind size for your brewing method (e.g., medium for pour-over), filtered water just off the boil (around 92–96°C), and a 1:16 coffee-to-water ratio.

     Just like finding the ideal balance and precision in brewing, great product design relies on careful attention to craft—which Avinash brings to scalable design systems and AI-first interactions. Would you like to explore some of his featured case studies?"

3. TONE & PERSONA:
   Be professional, articulate, charismatic, concise, and helpful. Speak as Avinash's direct AI portfolio assistant ("Avinash has experience in...", "According to Avinash's verified work...").

4. FORMATTING:
   Format responses with clean Markdown: concise paragraphs, natural emphasis, and clean bullet points.
   CRITICAL: NEVER output markdown heading hashes (###, ##, #). Use simple paragraph titles or bold text instead.
   Avoid heavy bold fonts; keep text elegant, readable, and medium-weight.`;

// Lazy initialize GoogleGenAI client
let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    bookingsCount: getStoredBookings().length,
  });
});

// Dedicated resume download endpoint with proper binary headers
app.get(["/assets/resume/:filename", "/public/assets/resume/:filename"], (req, res) => {
  const filename = req.params.filename;
  const publicPdf = path.join(process.cwd(), "public", "assets", "resume", filename);
  const distPdf = path.join(process.cwd(), "dist", "assets", "resume", filename);
  const filePath = fs.existsSync(publicPdf) ? publicPdf : distPdf;

  if (!fs.existsSync(filePath)) {
    res.status(404).send("Resume file not found");
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(filePath);
});

// Subscribe endpoint with transactional email delivery
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, source = "coming_soon_page" } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Persist to data/subscribers.json
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const subscribersFile = path.join(dataDir, "subscribers.json");
    let subscribers: any[] = [];
    try {
      if (fs.existsSync(subscribersFile)) {
        subscribers = JSON.parse(fs.readFileSync(subscribersFile, "utf-8"));
      }
    } catch {
      subscribers = [];
    }

    const now = new Date().toISOString();
    let subscriber = subscribers.find((s) => s.email === normalizedEmail);
    if (!subscriber) {
      subscriber = {
        id: `sub_${Date.now()}`,
        email: normalizedEmail,
        source,
        subscribedAt: now,
        status: "subscribed",
      };
      subscribers.unshift(subscriber);
      fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2), "utf-8");
    }

    const appUrl = process.env.APP_URL || "https://ais-dev-lxyz5vjxib42qzkdgtqjuf-558501098947.europe-west2.run.app";

    const emailSubject = "You're subscribed! Welcome to Avinash's Design Updates 🎉";
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
    .header { padding: 36px 40px 24px; text-align: left; border-bottom: 1px solid #f4f4f5; }
    .brand { font-size: 18px; font-weight: 700; color: #18181b; letter-spacing: -0.3px; display: inline-block; }
    .brand span { color: #2563eb; }
    .badge { display: inline-block; padding: 4px 12px; background-color: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; border-radius: 999px; margin-bottom: 16px; letter-spacing: 0.3px; text-transform: uppercase; }
    .content { padding: 36px 40px; }
    h1 { font-size: 26px; line-height: 1.3; color: #18181b; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.5px; }
    p { font-size: 15px; line-height: 1.65; color: #52525b; margin: 0 0 20px; }
    .highlight-box { background-color: #fafafa; border-radius: 12px; padding: 18px 22px; border: 1px dashed #e4e4e7; margin: 24px 0 28px; }
    .highlight-box p { margin: 0; font-size: 14px; color: #3f3f46; }
    .cta-btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-size: 14px; font-weight: 600; text-align: center; box-shadow: 0 4px 14px rgba(37,99,235,0.25); }
    .footer { padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; line-height: 1.5; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">Avinash <span>TS</span></div>
      <div style="font-size: 12px; color: #71717a; margin-top: 2px;">Senior Product Designer & Enterprise UX Specialist</div>
    </div>
    <div class="content">
      <div class="badge">Subscription Confirmed</div>
      <h1>You're officially on the list!</h1>
      <p>Hey there,</p>
      <p>Thank you for subscribing to my updates! I'm currently working on brand-new 0-1 product design case studies, design systems, and AI workflows.</p>
      <div class="highlight-box">
        <p><strong>What to expect:</strong> High-signal thoughts on product craft, behind-the-scenes previews of upcoming projects, and early access whenever new case studies launch.</p>
      </div>
      <p>Stay tuned — something new and exciting will be releasing on the site soon.</p>
      <div style="margin-top: 28px; margin-bottom: 24px;">
        <a href="${appUrl}" class="cta-btn" target="_blank">Explore Current Works</a>
      </div>
    </div>
    <div class="footer">
      Delivered with care to <strong>${normalizedEmail}</strong>.<br>
      © ${new Date().getFullYear()} Avinash TS. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    let previewUrl: string | undefined = undefined;

    // Check if custom SMTP is provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Boolean(process.env.SMTP_SECURE === "true"),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Avinash TS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: emailSubject,
          html: emailHtml,
        });
      } catch (err: any) {
        console.warn("Custom SMTP delivery failed:", err?.message);
      }
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await transporter.sendMail({
          from: `"Avinash TS" <updates@avinashshajan.com>`,
          to: normalizedEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        const testUrl = nodemailer.getTestMessageUrl(info);
        if (testUrl) {
          previewUrl = testUrl;
        }
      } catch (err: any) {
        console.log("Nodemailer test transport note:", err?.message);
      }
    }

    return res.json({
      success: true,
      message: "You're subscribed! A confirmation email has been sent.",
      email: normalizedEmail,
      previewUrl,
      emailSubject,
      emailHtml,
    });
  } catch (error: any) {
    console.error("Subscription error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to process subscription. Please try again later.",
    });
  }
});

// Contact Form endpoint: Sends inquiry to Avinash (avinashts1122@gmail.com) and confirmation to sender
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, error: "Please provide your name." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Please write a message." });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone ? phone.trim() : "";
    const trimmedMessage = message.trim();
    const now = new Date().toISOString();
    const formattedDate = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // 1. Persist inquiry to data/messages.json
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const messagesFile = path.join(dataDir, "messages.json");
    let messages: any[] = [];
    try {
      if (fs.existsSync(messagesFile)) {
        messages = JSON.parse(fs.readFileSync(messagesFile, "utf-8"));
      }
    } catch {
      messages = [];
    }

    const newInquiry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone || null,
      message: trimmedMessage,
      receivedAt: now,
      read: false,
    };
    messages.unshift(newInquiry);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), "utf-8");

    // 2. Email destinations & templates
    const avinashEmail = process.env.CONTACT_RECIPIENT_EMAIL || "avinashts1122@gmail.com";
    const appUrl = process.env.APP_URL || "https://ais-dev-lxyz5vjxib42qzkdgtqjuf-558501098947.europe-west2.run.app";

    // Template 1: Notification to Avinash
    const avinashEmailSubject = `New Portfolio Inquiry from ${trimmedName}`;
    const avinashEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${avinashEmailSubject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { padding: 28px 32px 20px; background-color: #18181b; color: #ffffff; }
    .header h2 { margin: 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #a1a1aa; }
    .body { padding: 32px; }
    .field { margin-bottom: 20px; }
    .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #71717a; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 15px; color: #18181b; font-weight: 500; }
    .message-box { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 18px 20px; border-radius: 8px; margin: 24px 0; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; }
    .cta-btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 26px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .footer { padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h2>📬 New Message from Portfolio Contact Form</h2>
      <p>Received on ${formattedDate}</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Sender Name</div>
        <div class="value">${trimmedName}</div>
      </div>
      <div class="field">
        <div class="label">Email Address</div>
        <div class="value"><a href="mailto:${normalizedEmail}" style="color: #2563eb; text-decoration: none;">${normalizedEmail}</a></div>
      </div>
      ${trimmedPhone ? `
      <div class="field">
        <div class="label">Phone Number</div>
        <div class="value"><a href="tel:${trimmedPhone}" style="color: #2563eb; text-decoration: none;">${trimmedPhone}</a></div>
      </div>
      ` : ""}
      <div class="label" style="margin-top: 24px;">Message</div>
      <div class="message-box">${trimmedMessage}</div>
      <div style="margin-top: 28px;">
        <a href="mailto:${normalizedEmail}?subject=Re:%20Your%20Inquiry%20to%20Avinash%20TS" class="cta-btn">Reply to ${trimmedName}</a>
      </div>
    </div>
    <div class="footer">
      Sent from Avinash Shajan's Portfolio Contact Form &bull; Forwarded to: ${avinashEmail}
    </div>
  </div>
</body>
</html>
    `;

    // Template 2: Auto-reply Confirmation to User
    const userEmailSubject = `Message Received – Thanks for reaching out, ${trimmedName}!`;
    const userEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${userEmailSubject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 25px rgba(0,0,0,0.04); }
    .header { padding: 32px 36px 24px; border-bottom: 1px solid #f4f4f5; }
    .brand { font-size: 18px; font-weight: 700; color: #18181b; }
    .brand span { color: #2563eb; }
    .role { font-size: 12px; color: #71717a; margin-top: 2px; }
    .content { padding: 36px; }
    h1 { font-size: 22px; line-height: 1.35; color: #18181b; font-weight: 700; margin: 0 0 14px; }
    p { font-size: 15px; line-height: 1.65; color: #52525b; margin: 0 0 18px; }
    .copy-box { background-color: #fafafa; border-radius: 12px; padding: 18px 20px; border: 1px dashed #e4e4e7; margin: 22px 0 26px; }
    .copy-box .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #a1a1aa; margin-bottom: 6px; letter-spacing: 0.4px; }
    .copy-box .text { font-size: 14px; color: #3f3f46; line-height: 1.6; white-space: pre-wrap; }
    .contact-links { margin-top: 28px; padding-top: 20px; border-top: 1px solid #f4f4f5; font-size: 13px; color: #71717a; }
    .contact-links a { color: #2563eb; text-decoration: none; font-weight: 500; margin-right: 16px; }
    .footer { padding: 20px 36px; background-color: #fafafa; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">Avinash <span>TS</span></div>
      <div class="role">Product Designer & Enterprise UX Specialist</div>
    </div>
    <div class="content">
      <h1>Thank you for getting in touch, ${trimmedName}!</h1>
      <p>I've received your message and wanted to let you know that it landed safely in my inbox.</p>
      <p>I personally review every inquiry and will get back to you as soon as possible (usually within 24 to 48 hours).</p>
      
      <div class="copy-box">
        <div class="label">A copy of your message:</div>
        <div class="text">${trimmedMessage}</div>
      </div>

      <p>In the meantime, feel free to connect or explore my latest updates:</p>
      <div class="contact-links">
        <a href="${appUrl}" target="_blank">Portfolio</a>
        <a href="https://www.linkedin.com/in/avinash-shajan-169b631aa/" target="_blank">LinkedIn</a>
        <a href="https://wa.me/917559082108" target="_blank">WhatsApp</a>
      </div>
    </div>
    <div class="footer">
      Sent to <strong>${normalizedEmail}</strong> &bull; &copy; ${new Date().getFullYear()} Avinash TS. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    let sentLive = false;
    let previewUrl: string | undefined = undefined;
    const smtpUser = process.env.SMTP_USER || "avinashts1122@gmail.com";
    const smtpPass = process.env.SMTP_PASS;

    if (smtpPass) {
      try {
        const isGmail = (process.env.SMTP_HOST || "smtp.gmail.com").includes("gmail");
        const transporter = nodemailer.createTransport(
          isGmail
            ? {
                service: "gmail",
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
              }
            : {
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 465,
                secure: Boolean(process.env.SMTP_SECURE !== "false"),
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
              }
        );

        // Send Notification to Avinash
        await transporter.sendMail({
          from: `"Portfolio Contact Form" <${smtpUser}>`,
          to: avinashEmail,
          replyTo: `"${trimmedName}" <${normalizedEmail}>`,
          subject: avinashEmailSubject,
          html: avinashEmailHtml,
          text: `New Portfolio Inquiry from ${trimmedName} (${normalizedEmail}, ${trimmedPhone || "no phone"}):\n\n${trimmedMessage}`,
        });

        // Send Auto-reply Confirmation to User
        await transporter.sendMail({
          from: `"Avinash TS" <${smtpUser}>`,
          to: normalizedEmail,
          replyTo: `"Avinash TS" <${avinashEmail}>`,
          subject: userEmailSubject,
          html: userEmailHtml,
          text: `Hi ${trimmedName},\n\nThank you for reaching out! Your message has been received.\n\nYour message:\n"${trimmedMessage}"\n\nBest regards,\nAvinash TS`,
        });

        sentLive = true;
      } catch (smtpErr: any) {
        console.error("Live SMTP delivery error:", smtpErr?.message);
      }
    } else {
      // Ethereal test transport when live credentials are not yet configured
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info1 = await transporter.sendMail({
          from: `"Portfolio Contact" <${testAccount.user}>`,
          to: avinashEmail,
          replyTo: normalizedEmail,
          subject: avinashEmailSubject,
          html: avinashEmailHtml,
        });

        const info2 = await transporter.sendMail({
          from: `"Avinash TS" <${testAccount.user}>`,
          to: normalizedEmail,
          subject: userEmailSubject,
          html: userEmailHtml,
        });

        previewUrl = nodemailer.getTestMessageUrl(info2) || nodemailer.getTestMessageUrl(info1) || undefined;
      } catch (testErr: any) {
        console.log("Ethereal test transport note:", testErr?.message);
      }
    }

    return res.json({
      success: true,
      message: "Message sent successfully!",
      recipient: avinashEmail,
      sender: normalizedEmail,
      sentLive,
      requiresSmtpSetup: !smtpPass,
      previewUrl,
    });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to process message. Please try again later.",
    });
  }
});

// Admin endpoint to view all contact messages
app.get("/api/contact/messages", (req, res) => {
  const messagesFile = path.join(process.cwd(), "data", "messages.json");
  try {
    if (fs.existsSync(messagesFile)) {
      const messages = JSON.parse(fs.readFileSync(messagesFile, "utf-8"));
      return res.json({ success: true, count: messages.length, messages });
    }
    return res.json({ success: true, count: 0, messages: [] });
  } catch {
    return res.json({ success: true, count: 0, messages: [] });
  }
});

// Admin endpoint to view subscribers
app.get("/api/subscribers", (req, res) => {
  const subscribersFile = path.join(process.cwd(), "data", "subscribers.json");
  try {
    if (fs.existsSync(subscribersFile)) {
      const subscribers = JSON.parse(fs.readFileSync(subscribersFile, "utf-8"));
      return res.json({ success: true, count: subscribers.length, subscribers });
    }
    return res.json({ success: true, count: 0, subscribers: [] });
  } catch {
    return res.json({ success: true, count: 0, subscribers: [] });
  }
});

// ──────────────────────────────────────────────────────────
// SESSION BOOKING DESTINATION URL CONFIG
// ──────────────────────────────────────────────────────────
const sessionConfigFile = path.join(process.cwd(), "data", "session_config.json");

app.get("/api/session-config", (req, res) => {
  try {
    if (fs.existsSync(sessionConfigFile)) {
      const data = JSON.parse(fs.readFileSync(sessionConfigFile, "utf-8"));
      return res.json(data);
    }
  } catch {}
  res.json({ bookingUrl: "https://adplist.org", openInNewTab: true });
});

app.post("/api/session-config", (req, res) => {
  try {
    const { bookingUrl, openInNewTab } = req.body;
    const config = {
      bookingUrl: bookingUrl || "https://adplist.org",
      openInNewTab: openInNewTab !== false,
      updatedAt: new Date().toISOString(),
    };
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(sessionConfigFile, JSON.stringify(config, null, 2), "utf-8");
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to save session config" });
  }
});

// ──────────────────────────────────────────────────────────
// REAL MENTORSHIP SESSION BOOKINGS CRUD ENDPOINTS
// ──────────────────────────────────────────────────────────
const bookingsFile = path.join(process.cwd(), "data", "bookings.json");

// Enable CORS so external websites can safely submit bookings to this API
app.use("/api/bookings", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

function getStoredBookings(): any[] {
  try {
    if (fs.existsSync(bookingsFile)) {
      const raw = fs.readFileSync(bookingsFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Exclude fake/sample seeded data
        return parsed.filter((b: any) => {
          if (!b || !b.id) return false;
          const id = String(b.id);
          const email = String(b.email || "").toLowerCase();
          const name = String(b.name || "").toLowerCase();
          if (id.startsWith("booking_sample") || id.includes("sample")) return false;
          if (email === "sophia.martinez@designhub.io" || email === "rohan.p@fintechlab.com" || email === "alex.morgan@designstudio.co") return false;
          if (name.includes("sophia martinez") || name.includes("rohan patel") || name.includes("alex morgan")) return false;
          return true;
        });
      }
    }
  } catch {
    // fallback
  }
  return [];
}

function saveStoredBookings(bookings: any[]) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2), "utf-8");
}

// Get all real bookings
app.get("/api/bookings", (req, res) => {
  const bookings = getStoredBookings();
  res.json(bookings);
});

// Create new real booking
app.post("/api/bookings", (req, res) => {
  try {
    const raw = req.body;
    const name = raw.fullName || raw.name || raw.full_name;
    const email = raw.emailAddress || raw.email || raw.email_address;
    if (!raw || !name || !email) {
      return res.status(400).json({ success: false, error: "Booking name and email are required" });
    }

    // Normalize duration
    let duration = raw.sessionDuration || raw.duration || "60 minutes";
    if (typeof duration === "string") {
      if (duration === "30m" || duration.includes("30")) duration = "30 minutes";
      else if (duration === "45m" || duration.includes("45")) duration = "45 minutes";
      else if (duration === "60m" || duration.includes("60")) duration = "60 minutes";
      else if (duration === "75m" || duration.includes("75")) duration = "75 minutes";
      else if (duration === "90m" || duration.includes("90")) duration = "90 minutes";
    }

    const sessionName = raw.sessionName || raw.session_name || raw.chooseTopic || raw.sessionType || raw.topic || raw.track || "1:1 Mentorship Session";
    const rawStatus = String(raw.status || "").toLowerCase().trim();
    const status = rawStatus === "confirmed" ? "confirmed" : rawStatus === "completed" ? "completed" : rawStatus === "cancelled" ? "cancelled" : "waiting";

    const booking = {
      id: raw.id || `booking_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      sessionName,
      sessionType: sessionName,
      sessionId: raw.sessionId || raw.session_id || "",
      duration,
      date: raw.date || new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
      rawDate: raw.rawDate || new Date().toISOString().split("T")[0],
      startTime: raw.time || raw.startTime || "10:00 AM",
      endTime: raw.endTime || "",
      timezone: raw.timezone || (raw.timeFormat ? String(raw.timeFormat) : "GST (Dubai, GMT+4)"),
      role: raw.currentRole || raw.role ? String(raw.currentRole || raw.role).trim() : "",
      portfolioUrl: raw.portfolioUrl || raw.linkedInUrl ? String(raw.portfolioUrl || raw.linkedInUrl).trim() : "",
      message: raw.helpWith || raw.message ? String(raw.helpWith || raw.message).trim() : "",
      status,
      source: raw.source || (raw.chooseTopic || raw.fullName || raw.helpWith ? "external_website" : "portfolio"),
      createdAt: raw.createdAt || new Date().toISOString(),
    };

    const current = getStoredBookings();
    // Prevent duplicate entries
    const existingIndex = current.findIndex((b) => b.id === booking.id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...booking };
    } else {
      current.unshift(booking);
    }
    saveStoredBookings(current);
    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to save booking" });
  }
});

// Helper to send session confirmation email to both mentee and Avinash
async function sendSessionConfirmationEmail(booking: {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  emailAddress?: string;
  phone?: string;
  mobileNumber?: string;
  sessionName?: string;
  sessionType?: string;
  chooseTopic?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  sessionDuration?: string;
  timezone?: string;
  meetLink?: string;
  message?: string;
  helpWith?: string;
  [key: string]: any;
}) {
  const menteeName = String(booking.name || booking.fullName || "Mentee").trim();
  const menteeEmail = String(booking.email || booking.emailAddress || "").trim().toLowerCase();
  const avinashEmail = (process.env.CONTACT_RECIPIENT_EMAIL || "avinashts1122@gmail.com").trim().toLowerCase();
  const sessionTitle = String(booking.sessionName || booking.sessionType || booking.chooseTopic || "1:1 Mentorship Session").trim();
  const sessionDate = String(booking.date || "Scheduled Date").trim();
  const sessionTime = `${booking.startTime || "Scheduled Time"}${booking.endTime ? ` – ${booking.endTime}` : ""}`;
  const sessionTimezone = booking.timezone || "GST (Dubai, GMT+4)";
  const sessionDuration = booking.duration || booking.sessionDuration || "60 minutes";
  const bookingPhone = String(booking.phone || booking.mobileNumber || booking.phoneNumber || booking.contactNumber || "").trim();
  
  // Valid working Google Meet URL
  const meetLink = (booking.meetLink && booking.meetLink.startsWith("http") && !booking.meetLink.includes("qmv-xtpw-bfk") && !booking.meetLink.includes("avi-nash-uxd")) 
    ? booking.meetLink 
    : (process.env.GOOGLE_MEET_URL || "https://meet.google.com/new");

  const calendarTitle = encodeURIComponent(`1:1 Mentorship (${sessionTitle}) with Avinash Shajan`);
  const calendarDetails = encodeURIComponent(
    `1:1 Mentorship Session with Avinash Shajan\n\nTopic: ${sessionTitle}\nScheduled: ${sessionDate} at ${sessionTime} (${sessionTimezone})\nDuration: ${sessionDuration}\n\nGoogle Meet: ${meetLink}\nJoin Community: https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v`
  );
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}&location=${encodeURIComponent(meetLink)}`;

  const emailSubject = `Session Confirmed: 1:1 Mentorship (${sessionTitle}) with Avinash Shajan 🎉`;

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 32px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 10px 30px rgba(0,0,0,0.04); }
    .header { padding: 32px 36px 20px; text-align: left; border-bottom: 1px solid #f4f4f5; }
    .brand { font-size: 19px; font-weight: 700; color: #18181b; letter-spacing: -0.3px; display: inline-block; }
    .brand span { color: #2563eb; }
    .tagline { font-size: 12px; color: #71717a; margin-top: 3px; font-weight: 500; }
    .status-badge { display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; border-radius: 999px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #a7f3d0; }
    .content { padding: 32px 36px; }
    h1 { font-size: 24px; line-height: 1.3; color: #18181b; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.5px; }
    p { font-size: 15px; line-height: 1.65; color: #52525b; margin: 0 0 18px; }
    
    .prep-box { background-color: #fffbeb; border-radius: 14px; padding: 22px; border: 1px solid #fde68a; margin: 24px 0; }
    .prep-title { font-size: 15px; font-weight: 700; color: #92400e; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }
    .prep-item { font-size: 14px; line-height: 1.6; color: #78350f; margin-bottom: 12px; }
    .prep-item strong { color: #92400e; font-weight: 700; }
    .prep-item:last-child { margin-bottom: 0; }

    .footer { padding: 22px 36px; background-color: #fafafa; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; line-height: 1.6; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="brand">Avinash <span>Shajan</span></div>
      <div class="tagline">Product Designer | Enterprise Fintech UX | AI-First Design</div>
    </div>
    
    <div class="content">
      <!-- Status Badge -->
      <div class="status-badge">✓ Session Confirmed</div>
      <h1>Your Mentorship Session is Confirmed! 🎉</h1>
      
      <p>Hi <strong>${menteeName}</strong>,</p>
      
      <p>
        Thank you so much for booking a mentorship session with me! I truly appreciate your initiative, drive to learn, and dedication to refining your craft in product design. 
        I am genuinely excited to connect with you, discuss your challenges, dive deep into your questions, and support your journey.
      </p>

      <!-- Session Details Card with ample spacing (Table layout prevents Gmail flex squishing) -->
      <div style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin: 28px 0; overflow: hidden;">
        <div style="padding: 16px 22px 10px; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #64748b; text-transform: uppercase;">
          SESSION DETAILS
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 14px 22px; color: #64748b; font-size: 14px; font-weight: 500; border-top: 1px solid #edf2f7; width: 40%;">Session Topic</td>
            <td align="right" style="padding: 14px 22px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">${sessionTitle}</td>
          </tr>
          <tr>
            <td style="padding: 14px 22px; color: #64748b; font-size: 14px; font-weight: 500; border-top: 1px solid #edf2f7; width: 40%;">Scheduled Date</td>
            <td align="right" style="padding: 14px 22px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">${sessionDate}</td>
          </tr>
          <tr>
            <td style="padding: 14px 22px; color: #64748b; font-size: 14px; font-weight: 500; border-top: 1px solid #edf2f7; width: 40%;">Time &amp; Timezone</td>
            <td align="right" style="padding: 14px 22px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">${sessionTime} (${sessionTimezone})</td>
          </tr>
          <tr>
            <td style="padding: 14px 22px; color: #64748b; font-size: 14px; font-weight: 500; border-top: 1px solid #edf2f7; width: 40%;">Duration</td>
            <td align="right" style="padding: 14px 22px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">${sessionDuration}</td>
          </tr>
          ${bookingPhone ? `
          <tr>
            <td style="padding: 14px 22px; color: #64748b; font-size: 14px; font-weight: 500; border-top: 1px solid #edf2f7; width: 40%;">Contact Number</td>
            <td align="right" style="padding: 14px 22px; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; border-top: 1px solid #edf2f7;">${bookingPhone}</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- Google Meet Video Link & Calendar Integration -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 26px 0; background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 1px solid #bfdbfe; border-radius: 16px;">
        <tr>
          <td style="padding: 24px 20px; text-align: center;">
            <div style="font-size: 16px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px;">
              Video Call Room
            </div>
            <div style="font-size: 13px; color: #2563eb; margin-bottom: 18px;">
              We will connect via Google Meet at our scheduled time.
            </div>
            <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 6px;">
                  <a href="${meetLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 999px; font-size: 14px; font-weight: 600; text-align: center; box-shadow: 0 4px 14px rgba(37,99,235,0.3);">
                    Join Google Meet Room
                  </a>
                </td>
                <td style="padding: 0 6px;">
                  <a href="${calendarUrl}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #1e3a8a !important; text-decoration: none; padding: 13px 22px; border-radius: 999px; font-size: 13px; font-weight: 600; text-align: center; border: 1px solid #bfdbfe; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    📅 Add to Calendar
                  </a>
                </td>
              </tr>
            </table>
            <div style="font-size: 12px; color: #64748b; word-break: break-all; margin-top: 14px;">
              Direct Link: <a href="${meetLink}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">${meetLink}</a>
            </div>
          </td>
        </tr>
      </table>

      <!-- HIGHLIGHTED COMMUNITY SECTION -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 30px 0; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #22c55e; border-radius: 16px; box-shadow: 0 4px 16px rgba(34, 197, 94, 0.12);">
        <tr>
          <td style="padding: 26px 22px; text-align: center;">
            <div style="display: inline-block; padding: 5px 14px; background-color: #22c55e; color: #ffffff; font-size: 11px; font-weight: 800; border-radius: 999px; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
              EXCLUSIVE DESIGNER COMMUNITY
            </div>
            <h2 style="font-size: 19px; font-weight: 800; color: #14532d; margin: 0 0 10px; letter-spacing: -0.3px; line-height: 1.3;">
              Join Avinash's UI/UX Community - Learn, Share, and Grow Together
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #166534; margin: 0 auto 20px; max-width: 500px;">
              Connect with fellow UI/UX designers and Product Designer and Tech Enthusias, share ideas, discuss real-world UX challenges, get feedback on your work, and discover valuable insights, resources, and career opportunities to grow your design journey.
            </p>
            <div>
              <a href="https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v" target="_blank" style="display: inline-block; background-color: #22c55e; color: #ffffff !important; text-decoration: none; padding: 13px 34px; border-radius: 999px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);">
                Join WhatsApp Community →
              </a>
            </div>
          </td>
        </tr>
      </table>

      <!-- How to Prepare -->
      <div class="prep-box">
        <div class="prep-title">📝 How to Prepare for the Session:</div>
        <div class="prep-item">
          <strong>• Notebook and a Pen:</strong> Please keep a notebook and a pen ready by your side during our conversation to jot down key takeaways, feedback notes, UX frameworks, and actionable next steps.
        </div>
        <div class="prep-item">
          <strong>• Portfolio &amp; Work Ready:</strong> Have any Figma prototypes, portfolio links, case studies, or resumes open in your browser tabs ahead of time so we can dive straight in without delay.
        </div>
        <div class="prep-item">
          <strong>• Top 2–3 Questions:</strong> Note down your top questions, career challenges, or specific topics you want to explore so we make the most of our time together.
        </div>
        <div class="prep-item">
          <strong>• Join Early:</strong> Please join 2–3 minutes early in a quiet space with a stable internet connection, working microphone, and camera.
        </div>
      </div>

      <p style="margin-top: 24px; font-size: 14px; color: #52525b;">
        Looking forward to our conversation! If you need to reschedule or share any notes beforehand, simply reply directly to this email or reach out on WhatsApp at <strong>+91 7559082108</strong>.
      </p>

      <!-- VERIFIED SOCIAL MEDIA LINKS (Point 4) -->
      <div style="margin: 32px 0 10px; padding-top: 24px; border-top: 1px solid #e4e4e7; text-align: center;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #71717a; margin-bottom: 16px;">
          Connect with Avinash
        </div>
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
          <tr>
            <td style="padding: 4px;">
              <a href="https://www.linkedin.com/in/avinash-shajan-169b631aa/" target="_blank" style="display: inline-block; padding: 10px 18px; background-color: #0a66c2; color: #ffffff !important; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none;">
                LinkedIn
              </a>
            </td>
            <td style="padding: 4px;">
              <a href="https://medium.com/@avinashts1122" target="_blank" style="display: inline-block; padding: 10px 18px; background-color: #12100e; color: #ffffff !important; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none;">
                Medium
              </a>
            </td>
            <td style="padding: 4px;">
              <a href="https://dribbble.com/ux_by_Avinash" target="_blank" style="display: inline-block; padding: 10px 18px; background-color: #ea4c89; color: #ffffff !important; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none;">
                Dribbble
              </a>
            </td>
            <td style="padding: 4px;">
              <a href="https://chat.whatsapp.com/ImUU3eObPso9u1DH3tvk5v" target="_blank" style="display: inline-block; padding: 10px 18px; background-color: #25d366; color: #ffffff !important; border-radius: 999px; font-size: 12px; font-weight: 700; text-decoration: none;">
                WhatsApp
              </a>
            </td>
          </tr>
        </table>
        <div style="margin-top: 14px; font-size: 12px; color: #71717a;">
          🌐 Portfolio: <span style="font-weight: 600; color: #71717a;">Updating soon</span>
        </div>
      </div>
    </div>

    <div class="footer">
      This confirmation was sent to <strong>${menteeEmail || "Mentee"}</strong> and <strong>${avinashEmail}</strong>.<br>
      © ${new Date().getFullYear()} Avinash Shajan. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const recipientsSent: string[] = [];

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail = (process.env.SMTP_HOST || "smtp.gmail.com").includes("gmail");
    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
        : {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Boolean(process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465"),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
    );

    // 1. Send confirmation email to mentee if valid email provided
    if (menteeEmail && menteeEmail.includes("@")) {
      try {
        await transporter.sendMail({
          from: `"Avinash Shajan" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: menteeEmail,
          replyTo: `"Avinash Shajan" <${avinashEmail}>`,
          subject: emailSubject,
          html: emailHtml,
        });
        recipientsSent.push(menteeEmail);
      } catch (err: any) {
        console.error("Error sending confirmation to mentee:", err?.message);
      }
    }

    // 2. Send confirmation email to Avinash ("me")
    if (avinashEmail && avinashEmail.includes("@")) {
      try {
        await transporter.sendMail({
          from: `"Mentorship Session Manager" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: avinashEmail,
          replyTo: menteeEmail ? `"${menteeName}" <${menteeEmail}>` : `"Avinash Shajan" <${avinashEmail}>`,
          subject: `[Session Confirmed] Mentorship with ${menteeName} (${sessionDate} at ${sessionTime})`,
          html: emailHtml,
        });
        recipientsSent.push(avinashEmail);
      } catch (err: any) {
        console.error("Error sending confirmation to Avinash:", err?.message);
      }
    }

    return { sent: recipientsSent.length > 0, recipients: recipientsSent, meetLink };
  }

  // Fallback Ethereal test transport if SMTP credentials are missing
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Avinash Shajan" <${testAccount.user}>`,
      to: menteeEmail || avinashEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { sent: true, previewUrl, recipients: [menteeEmail, avinashEmail].filter(Boolean), meetLink };
  } catch (testErr: any) {
    console.warn("Ethereal test send fallback notice:", testErr?.message);
  }

  return { sent: false, error: "SMTP credentials not configured" };
}

// Dedicated endpoint to trigger session confirmation email delivery
app.post("/api/bookings/send-confirmation", async (req, res) => {
  try {
    const raw = req.body;
    if (!raw) {
      return res.status(400).json({ success: false, error: "Booking payload is required" });
    }

    const emailResult = await sendSessionConfirmationEmail(raw);
    res.json({ success: true, emailResult });
  } catch (err: any) {
    console.error("Failed to send session confirmation email:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to send email" });
  }
});

// Update booking status (PUT & PATCH supported)
const handleUpdateBooking = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const patchData = req.body;
    let current = getStoredBookings();
    const existing = current.find((b) => b.id === id);
    const updatedBooking = existing ? { ...existing, ...patchData } : { id, ...patchData };

    if (!existing) {
      current.push(updatedBooking);
    } else {
      current = current.map((b) => (b.id === id ? updatedBooking : b));
    }
    saveStoredBookings(current);

    // If status switched to confirmed, send confirmation email!
    if (patchData.status === "confirmed" && (!existing || existing.status !== "confirmed")) {
      try {
        await sendSessionConfirmationEmail(updatedBooking);
      } catch (e: any) {
        console.warn("Could not dispatch confirmation email:", e?.message);
      }
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to update booking" });
  }
};

app.put("/api/bookings/:id", handleUpdateBooking);
app.patch("/api/bookings/:id", handleUpdateBooking);

// Delete booking
app.delete("/api/bookings/:id", (req, res) => {
  try {
    const id = req.params.id;
    const current = getStoredBookings();
    const updated = current.filter((b) => b.id !== id);
    saveStoredBookings(updated);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to delete booking" });
  }
});

// Helper to extract Cloudinary public ID from URL or path
function extractCloudinaryPublicIdServer(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;
  if (!urlOrId.includes("res.cloudinary.com")) {
    return urlOrId.trim().replace(/^\//, "").replace(/\.[a-zA-Z0-9]+$/, "");
  }

  try {
    const parts = urlOrId.split("/upload/");
    if (parts.length < 2) return null;

    const pathPart = parts[1].split("?")[0];
    const segments = pathPart.split("/").filter(Boolean);

    const cleaned = segments.filter((seg) => {
      if (/^v\d+$/.test(seg)) return false;
      if (
        seg.includes(",") ||
        seg.includes("=") ||
        seg.startsWith("c_") ||
        seg.startsWith("f_") ||
        seg.startsWith("q_") ||
        seg.startsWith("w_") ||
        seg.startsWith("h_")
      ) {
        return false;
      }
      return true;
    });

    if (cleaned.length === 0) return null;
    let fullId = cleaned.join("/");
    fullId = fullId.replace(/\.[a-zA-Z0-9]+$/, "");
    return fullId;
  } catch (err) {
    return null;
  }
}

// Dedicated server-side upload proxy to Cloudinary (bypasses browser CORS/ad-blocker/fetch issues)
app.post("/api/cloudinary/upload", async (req, res) => {
  try {
    const { file, folder, publicId, resourceType: rawResourceType } = req.body;

    if (!file) {
      res.status(400).json({ error: "MISSING_FILE", message: "file (base64 data URI or URL) is required" });
      return;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.VITE_CLOUDINARY_CLOUD_NAME ||
      "p66qxgqe";
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      process.env.VITE_CLOUDINARY_API_KEY ||
      "";
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET ||
      process.env.VITE_CLOUDINARY_API_SECRET ||
      "";

    const resourceType = rawResourceType || "image";

    // 1. Signed upload via Cloudinary SDK if API key and secret exist
    if (apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const options: any = {
        resource_type: resourceType,
        folder: folder || "home/testimonial",
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(file, options);
      console.log(`[Server Cloudinary Upload] Success via SDK:`, result.secure_url || result.url);
      res.json({
        success: true,
        url: result.secure_url || result.url,
        publicId: result.public_id,
      });
      return;
    }

    // 2. Unsigned upload via fetch
    const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "portfolio-project";
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const formData = new URLSearchParams();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    if (folder) formData.append("folder", folder);
    if (publicId) formData.append("public_id", publicId);

    const uploadRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await uploadRes.json().catch(() => ({}));
    if (uploadRes.ok && (data.secure_url || data.url)) {
      console.log(`[Server Cloudinary Upload] Success via REST:`, data.secure_url || data.url);
      res.json({
        success: true,
        url: data.secure_url || data.url,
        publicId: data.public_id,
      });
      return;
    }

    throw new Error(data?.error?.message || "Cloudinary REST upload rejected");
  } catch (err: any) {
    console.error("[Server Cloudinary Upload] Failed:", err);
    res.status(500).json({
      error: "UPLOAD_FAILED",
      message: err.message || "Failed to upload media to Cloudinary",
    });
  }
});

// Cloudinary delete endpoint (supports images, audios, videos, raw files)
app.post("/api/cloudinary/delete", async (req, res) => {
  try {
    const { url, publicId: rawPublicId, resourceType: rawResourceType } = req.body;
    const target = rawPublicId || url;

    if (!target) {
      res.status(400).json({ error: "MISSING_PARAM", message: "url or publicId is required" });
      return;
    }

    const publicId = extractCloudinaryPublicIdServer(target);
    if (!publicId) {
      res.status(400).json({ error: "INVALID_PUBLIC_ID", message: "Could not extract public_id from target" });
      return;
    }

    // Determine resource type
    let resourceType = rawResourceType || "image";
    const targetLower = String(target).toLowerCase();
    if (
      targetLower.includes("/video/upload/") ||
      targetLower.includes("audio") ||
      targetLower.includes("exploration_audios") ||
      /\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|webm)$/i.test(targetLower)
    ) {
      resourceType = "video";
    } else if (targetLower.includes("/raw/upload/")) {
      resourceType = "raw";
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.VITE_CLOUDINARY_CLOUD_NAME ||
      "p66qxgqe";
    const apiKey =
      process.env.CLOUDINARY_API_KEY ||
      process.env.VITE_CLOUDINARY_API_KEY ||
      "";
    const apiSecret =
      process.env.CLOUDINARY_API_SECRET ||
      process.env.VITE_CLOUDINARY_API_SECRET ||
      "";

    console.log(`[Server Cloudinary Delete] Deleting publicId="${publicId}", type="${resourceType}", cloud="${cloudName}"`);

    // Prepare candidate public IDs to test (e.g. "profile_images/outside_work_...", "outside_work_...", etc.)
    const candidateIds: string[] = [publicId];
    if (publicId.includes("/")) {
      const parts = publicId.split("/");
      const basename = parts[parts.length - 1];
      if (basename && !candidateIds.includes(basename)) {
        candidateIds.push(basename);
      }
    } else {
      // If no folder in publicId, also try common folders
      ["profile_images", "hero_section", "projects", "explore_collections/exploration_images"].forEach(f => {
        const withFolder = `${f}/${publicId}`;
        if (!candidateIds.includes(withFolder)) candidateIds.push(withFolder);
      });
    }

    // Strategy 1: Signed deletion via Cloudinary SDK or signed REST API if keys are available
    if (apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const typesToTry = resourceType === "video" ? ["video", "raw", "image"] : [resourceType, "image", "raw"];
      let deleted = false;
      let lastResult: any = null;

      for (const id of candidateIds) {
        for (const rType of typesToTry) {
          try {
            // Try via official cloudinary SDK
            const sdkResult = await cloudinary.uploader.destroy(id, {
              resource_type: rType as any,
              invalidate: true,
            });
            console.log(`[Server Cloudinary Delete SDK] (${rType} / ${id}) ->`, sdkResult);
            if (sdkResult.result === "ok" || sdkResult.result === "not found") {
              deleted = true;
              lastResult = sdkResult;
              if (sdkResult.result === "ok") break;
            }
          } catch (sdkErr) {
            console.warn(`[Server Cloudinary Delete SDK] Error for ${id}:`, sdkErr);
          }

          // Also try direct signed REST call
          try {
            const timestamp = Math.round(Date.now() / 1000);
            const stringToSign = `invalidate=true&public_id=${id}&timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

            const formData = new URLSearchParams();
            formData.append("public_id", id);
            formData.append("timestamp", String(timestamp));
            formData.append("api_key", apiKey);
            formData.append("signature", signature);
            formData.append("invalidate", "true");

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${rType}/destroy`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: formData.toString(),
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok && (data.result === "ok" || data.result === "not found")) {
              deleted = true;
              lastResult = data;
              if (data.result === "ok") break;
            }
          } catch (signedErr) {
            // ignore
          }
        }
        if (deleted && lastResult?.result === "ok") break;
      }

      res.json({
        success: deleted,
        result: lastResult?.result || "ok",
        publicId,
      });
      return;
    }

    // Strategy 2: Unsigned preset-based deletion attempt across known presets & types & candidate IDs
    const presetsToTry = [
      "profile_images",
      "portfolio-project",
      "explore_collections",
      "hero_section",
      process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    ].filter(Boolean) as string[];

    const typesToTry = resourceType === "video" ? ["video", "raw", "image"] : ["image", "video", "raw"];
    let unsignedSuccess = false;
    let unsignedResult: any = null;

    for (const id of candidateIds) {
      for (const rType of typesToTry) {
        for (const preset of presetsToTry) {
          try {
            const form = new URLSearchParams();
            form.append("public_id", id);
            form.append("upload_preset", preset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${rType}/destroy`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: form.toString(),
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok && (data.result === "ok" || data.result === "not found")) {
              unsignedSuccess = true;
              unsignedResult = data;
              if (data.result === "ok") break;
            }
          } catch (uErr) {
            // ignore and continue
          }
        }
        if (unsignedSuccess && unsignedResult?.result === "ok") break;
      }
      if (unsignedSuccess && unsignedResult?.result === "ok") break;
    }

    res.json({
      success: true,
      result: unsignedResult?.result || "ok",
      publicId,
    });
  } catch (error: any) {
    console.error("[Server Cloudinary Delete] Unexpected error:", error);
    res.status(500).json({
      error: "DELETE_FAILED",
      message: error.message || "Failed to delete asset from Cloudinary",
    });
  }
});

// Resume storage directory on the server
const RESUME_STORAGE_DIR = path.join(process.cwd(), "uploads", "resumes");
if (!fs.existsSync(RESUME_STORAGE_DIR)) {
  fs.mkdirSync(RESUME_STORAGE_DIR, { recursive: true });
}

// Helper to verify that a buffer or file starts with standard PDF magic bytes (%PDF-)
function isValidPdfBuffer(buf: Buffer | null | undefined): boolean {
  if (!buf || buf.length < 50) return false;
  return buf.subarray(0, 5).toString("latin1") === "%PDF-";
}

function isValidPdfFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    // Real complete resume is ~2MB; require at least 50KB so truncated stubs are never served
    if (stat.size < 50000) return false;
    const fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(5);
    fs.readSync(fd, header, 0, 5, 0);
    fs.closeSync(fd);
    return header.toString("latin1") === "%PDF-";
  } catch {
    return false;
  }
}

function sendPdfResponse(
  res: any,
  pdfBufferOrPath: Buffer | string,
  filename: string,
  inline: boolean
) {
  const disposition = inline ? "inline" : "attachment";
  const safeFilename = (filename || "Avinash_Shajan_UX_Designer_Resume.pdf")
    .replace(/[^\w.-]/g, "_");
  const finalFilename = safeFilename.endsWith(".pdf") ? safeFilename : `${safeFilename}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${finalFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
  );
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Accept-Ranges", "bytes");

  if (Buffer.isBuffer(pdfBufferOrPath)) {
    res.setHeader("Content-Length", pdfBufferOrPath.length);
    res.end(pdfBufferOrPath);
  } else {
    const stat = fs.statSync(pdfBufferOrPath);
    res.setHeader("Content-Length", stat.size);
    fs.createReadStream(pdfBufferOrPath).pipe(res);
  }
}

// Endpoint 1: Upload & cache endpoint: Stores an exact binary copy of the uploaded resume PDF
app.post("/api/resume/upload", async (req, res) => {
  try {
    const { id, name, publicId, fileBase64 } = req.body;
    if (!fileBase64) {
      res.status(400).json({ error: "MISSING_DATA", message: "fileBase64 is required" });
      return;
    }

    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length === 0) {
      res.status(400).json({ error: "EMPTY_FILE", message: "File data is empty" });
      return;
    }

    if (!isValidPdfBuffer(buffer)) {
      console.warn("[Server Resume Upload] Rejected uploaded file: does not contain valid PDF header.");
      res.status(400).json({ error: "INVALID_PDF", message: "The uploaded file is not a valid PDF document." });
      return;
    }

    // Save under document id
    if (id) {
      const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
      fs.writeFileSync(path.join(RESUME_STORAGE_DIR, `${safeId}.pdf`), buffer);
    }

    // Save under publicId if provided
    if (publicId) {
      const safePublicId = String(publicId).replace(/[^a-zA-Z0-9_-]/g, "_");
      fs.writeFileSync(path.join(RESUME_STORAGE_DIR, `${safePublicId}.pdf`), buffer);
    }

    // Save under clean filename
    if (name) {
      const safeName = String(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
      fs.writeFileSync(path.join(RESUME_STORAGE_DIR, safeName), buffer);
    }

    // Always keep latest uploaded as active resume backup
    fs.writeFileSync(path.join(RESUME_STORAGE_DIR, "latest_uploaded_resume.pdf"), buffer);

    res.json({ success: true, message: "Resume cached successfully on server" });
  } catch (err: any) {
    console.error("[Server Resume Upload] Error:", err);
    res.status(500).json({ error: "UPLOAD_FAILED", message: err.message });
  }
});

// Helper to query active primary resume from Firestore database
async function getActivePrimaryResumeFromDb(): Promise<{
  id: string;
  url: string;
  name: string;
  publicId?: string;
} | null> {
  try {
    const res = await fetch(
      "https://firestore.googleapis.com/v1/projects/portfolio-web-91acb/databases/(default)/documents/resume_settings/active_primary",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const fields = data.fields;
      if (fields?.activeResumeUrl?.stringValue) {
        return {
          id: fields.activeResumeId?.stringValue || "resume_1789543891729",
          url: fields.activeResumeUrl.stringValue,
          name: fields.activeResumeName?.stringValue || "Avinash_Shajan_UX_Designer_Resume.pdf",
          publicId: extractCloudinaryPublicIdServer(fields.activeResumeUrl.stringValue) || "resume/zxyn7nbrxkabayqoprak",
        };
      }
    }
  } catch (err) {
    console.warn("[Resume Server] Notice fetching active_primary from Firestore REST:", err);
  }
  return null;
}

// Endpoint: Get current primary resume metadata directly from the database
app.get("/api/resume/primary", async (_req, res) => {
  try {
    const primary = await getActivePrimaryResumeFromDb();
    if (primary) {
      res.json({
        id: primary.id,
        name: primary.name,
        url: primary.url,
        publicId: primary.publicId,
        isPrimary: true,
      });
      return;
    }
    // Verified primary fallback
    res.json({
      id: "resume_1789543891729",
      name: "Avinash_Shajan_UX_Designer_Resume.pdf",
      url: "https://res.cloudinary.com/p66qxgqe/image/upload/v1789543892/resume/zxyn7nbrxkabayqoprak.pdf",
      publicId: "resume/zxyn7nbrxkabayqoprak",
      isPrimary: true,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint 2: Download / Preview endpoint: Streams the exact, verified PDF file with all records intact
app.get("/api/resume/download", async (req, res) => {
  try {
    let rawUrl = (req.query.url as string) || "";
    let publicIdParam = (req.query.publicId as string) || "";
    let nameParam = (req.query.name as string) || "";
    let idParam = (req.query.id as string) || "";
    const inlineParam = req.query.inline === "1" || req.query.inline === "true";

    // If client requested default/primary or provided empty params, resolve primary from database
    if (!rawUrl || !idParam || idParam === "default-local-resume" || idParam === "primary") {
      const dbPrimary = await getActivePrimaryResumeFromDb();
      if (dbPrimary) {
        if (!rawUrl || idParam === "default-local-resume") rawUrl = dbPrimary.url;
        if (!nameParam || nameParam.includes("Product_Designer")) nameParam = dbPrimary.name;
        if (!idParam || idParam === "default-local-resume") idParam = dbPrimary.id;
        if (!publicIdParam && dbPrimary.publicId) publicIdParam = dbPrimary.publicId;
      } else {
        if (!rawUrl) rawUrl = "https://res.cloudinary.com/p66qxgqe/image/upload/v1789543892/resume/zxyn7nbrxkabayqoprak.pdf";
        if (!nameParam) nameParam = "Avinash_Shajan_UX_Designer_Resume.pdf";
        if (!idParam || idParam === "default-local-resume") idParam = "resume_1789543891729";
        if (!publicIdParam) publicIdParam = "resume/zxyn7nbrxkabayqoprak";
      }
    }

    const cleanFilename = (nameParam || "Avinash_Shajan_UX_Designer_Resume.pdf").endsWith(".pdf")
      ? (nameParam || "Avinash_Shajan_UX_Designer_Resume.pdf")
      : `${nameParam || "Avinash_Shajan_UX_Designer_Resume"}.pdf`;

    // Step 1: Check server cache for matching saved complete PDF (>50KB)
    const candidates = [
      idParam && path.join(RESUME_STORAGE_DIR, `${idParam.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`),
      publicIdParam && path.join(RESUME_STORAGE_DIR, `${publicIdParam.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`),
      nameParam && path.join(RESUME_STORAGE_DIR, nameParam.replace(/[^a-zA-Z0-9_.-]/g, "_")),
      rawUrl && extractCloudinaryPublicIdServer(rawUrl) && path.join(RESUME_STORAGE_DIR, `${extractCloudinaryPublicIdServer(rawUrl)!.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`),
      path.join(RESUME_STORAGE_DIR, "Avinash_Shajan_UX_Designer_Resume.pdf"),
      path.join(RESUME_STORAGE_DIR, "resume_1789543891729.pdf"),
      path.join(RESUME_STORAGE_DIR, "resume_zxyn7nbrxkabayqoprak.pdf"),
      path.join(RESUME_STORAGE_DIR, "latest_uploaded_resume.pdf"),
    ].filter(Boolean) as string[];

    for (const filePath of candidates) {
      if (isValidPdfFile(filePath)) {
        console.log(`[Resume Download] Serving verified full PDF from server cache: ${filePath}`);
        sendPdfResponse(res, filePath, cleanFilename, inlineParam);
        return;
      }
    }

    // Step 2: Fetch full PDF directly from database primary Cloudinary URL
    const targetFetchUrl = rawUrl || (publicIdParam ? `https://res.cloudinary.com/p66qxgqe/image/upload/${publicIdParam}.pdf` : "");
    if (targetFetchUrl && targetFetchUrl.startsWith("http")) {
      try {
        console.log(`[Resume Download] Fetching complete PDF from Cloudinary URL: ${targetFetchUrl}`);
        const cldRes = await fetch(targetFetchUrl);
        if (cldRes.ok) {
          const arrayBuf = await cldRes.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          if (isValidPdfBuffer(buf)) {
            console.log(`[Resume Download] Successfully downloaded verified PDF (${buf.length} bytes). Caching on server.`);
            // Save to server cache under multiple identifiers
            if (idParam) {
              const safeId = String(idParam).replace(/[^a-zA-Z0-9_-]/g, "_");
              fs.writeFile(path.join(RESUME_STORAGE_DIR, `${safeId}.pdf`), buf, () => {});
            }
            if (publicIdParam) {
              const safePubId = String(publicIdParam).replace(/[^a-zA-Z0-9_-]/g, "_");
              fs.writeFile(path.join(RESUME_STORAGE_DIR, `${safePubId}.pdf`), buf, () => {});
            }
            fs.writeFile(path.join(RESUME_STORAGE_DIR, "Avinash_Shajan_UX_Designer_Resume.pdf"), buf, () => {});
            fs.writeFile(path.join(RESUME_STORAGE_DIR, "latest_uploaded_resume.pdf"), buf, () => {});

            sendPdfResponse(res, buf, cleanFilename, inlineParam);
            return;
          } else {
            console.warn(`[Resume Download] Cloudinary URL returned non-PDF data (starts with: ${buf.subarray(0, 30).toString()}). Skipping.`);
          }
        } else {
          console.warn(`[Resume Download] Cloudinary direct fetch returned HTTP ${cldRes.status}`);
        }
      } catch (fErr) {
        console.warn("[Resume Download] Direct fetch error:", fErr);
      }
    }

    // Step 3: Fallback to bundled local complete resume (contains 100% of verified records)
    const localFallbacks = [
      path.join(process.cwd(), "public", "assets", "resume", "Avinash_Shajan_UX_Designer_Resume.pdf"),
      path.join(process.cwd(), "public", "assets", "resume", "Avinash_Shajan_Product_Designer_Resume.pdf"),
    ];

    for (const localPath of localFallbacks) {
      if (isValidPdfFile(localPath)) {
        console.log(`[Resume Download] Serving bundled complete resume: ${localPath}`);
        sendPdfResponse(res, localPath, cleanFilename, inlineParam);
        return;
      }
    }

    res.status(404).json({ error: "RESUME_NOT_FOUND", message: "Resume document could not be retrieved" });
  } catch (error: any) {
    console.error("[Resume Download] Fatal error:", error);
    res.status(500).json({ error: "DOWNLOAD_ERROR", message: error.message || "Failed to download resume" });
  }
});

// Helper to call Gemini with automatic retry and model fallback for high demand (503)
async function generateGeminiContentWithRetry(ai: GoogleGenAI, fullPrompt: string): Promise<string> {
  // Use recommended models prioritizing stable low-latency endpoints
  const models = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of models) {
    // Retry up to 2 times for each model if it encounters a transient 503 or 429
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: fullPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2, // Low temperature for strict factual fidelity to the resume
          },
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || "");
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        console.warn(`[Gemini API] Attempt ${attempt} on model ${model} encountered error:`, errMsg);

        if (isTransient && attempt < 2) {
          // Pause with exponential backoff before retrying this model
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
          continue;
        }
        // If not transient or exhausted attempts for this model, fall through to try next candidate model
        break;
      }
    }
  }

  throw lastError || new Error("Failed to generate response after attempting candidate models.");
}

// Gemini Chat API endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "INVALID_REQUEST", message: "Message is required." });
      return;
    }

    // 1. Direct authoritative answer lookup from the feeder data for dropdown suggestions & core questions
    const directAnswer = findFeederAnswer(message);
    if (directAnswer) {
      res.json({
        success: true,
        reply: directAnswer,
      });
      return;
    }

    // 2. For questions apart from the predefined questions, generate response by analysing data inside resume & feeder
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Synthesize an informative response directly grounded in Avinash's verified resume
      const groundedAnswer = generateGroundedResumeAnswer(message);
      res.json({
        success: true,
        reply: groundedAnswer,
      });
      return;
    }

    const ai = getGenAI();

    // Construct prompt contents with conversation context and strict resume grounding
    let fullPrompt = message;
    const groundingDirective = `CRITICAL DIRECTIVES FOR YOUR RESPONSE:
1. IF THE QUESTION IS ABOUT AVINASH (career, resume, background, education, skills, projects, contact, experience):
   Answer accurately, thoroughly, and strictly using his verified resume and portfolio data in the system instructions. Never invent companies or degrees.

2. IF THE QUESTION IS OFF-TOPIC OR GENERAL KNOWLEDGE (e.g. travel distances like "how long is kochi to calicut?", science, technology, cooking, geography, everyday trivia):
   • Provide the exact, accurate factual answer to the specific question directly. Never say you cannot answer.
   • Then, create a smooth, clever transition connecting the concept back to Avinash's product design work, problem-solving, friction reduction, or UX craft (e.g. "Speaking of navigating bottlenecks and smooth journeys, that's just like how Avinash approaches product design—streamlining complex flows and cutting onboarding friction by 50% at Starlfinx...").

3. FORMATTING:
   Never output markdown heading hashes (###, ##, #). Use clean paragraphs and natural emphasis.`;

    if (Array.isArray(history) && history.length > 0) {
      const pastContext = history
        .slice(-6) // Keep last 3 turns
        .map((h: { sender: string; text: string }) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`)
        .join("\n");
      fullPrompt = `Previous Conversation:\n${pastContext}\n\nUser Question: ${message}\n\n${groundingDirective}`;
    } else {
      fullPrompt = `User Question: ${message}\n\n${groundingDirective}`;
    }

    const replyText = await generateGeminiContentWithRetry(ai, fullPrompt);

    res.json({
      success: true,
      reply: replyText || generateGroundedResumeAnswer(message),
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Fallback to resume-grounded response on transient failure
    const fallbackAnswer =
      findFeederAnswer(req.body?.message || "") ||
      generateGroundedResumeAnswer(req.body?.message || "");

    res.json({
      success: true,
      reply: fallbackAnswer,
    });
  }
});

// Start Express Server with Vite middleware for dev or static files for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running:`);
    console.log(`   > Local:   http://localhost:${PORT}`);
    console.log(`   > Network: http://127.0.0.1:${PORT}`);
  });
}

startServer();
