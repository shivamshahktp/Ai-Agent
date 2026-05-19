import { GoogleGenerativeAI } from "@google/generative-ai";

const analyzeTicket = async (ticket) => {
  console.log("🤖 AI Agent: Connecting to Gemini 2.5 Flash (Stable V1)...");
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // This is the CRITICAL fix for 2026:
    // We use gemini-3-flash and FORCE the apiVersion to 'v1'
    const model = genAI.getGenerativeModel(
      { 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      }, 
      { apiVersion: "v1" } 
    ); 

    const prompt = `
      You are an expert IT Helpdesk Triage Agent for an enterprise organization.
      Your job is to analyze the user's IT support ticket and provide a strictly formatted JSON response.
      
      Ticket Title: "${ticket.title}"
      Ticket Description: "${ticket.description}"
      
      Instructions for your JSON response:
      1. "summary": Provide a concise 1-2 sentence summary of the core issue.
      2. "priority": Determine the urgency. Use "high" for complete system outages, hardware failures, or security issues. Use "medium" for software bugs or performance issues. Use "low" for feature requests or minor questions.
      3. "helpfulNotes": If it's a complex issue, provide detailed diagnostic steps for the IT technician. If it's a simple user-error or FAQ, write the complete step-by-step solution for the user.
      4. "relatedSkills": An array of technical tags needed to solve this (e.g., ["Hardware", "MacOS", "Database", "Networking"]).
      5. "isAutoResolvable": Set this to true ONLY if you are 100% confident that your "helpfulNotes" fully solve the user's problem without needing a human IT agent. Otherwise, set it to false.
      
      Respond ONLY with the JSON object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean markdown code blocks
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    console.log("✅ AI Agent: SUCCESS! Gemini 2.5 has responded.");
    return JSON.parse(text);

  } catch (error) {
    // If it STILL 404s, we will print the exact URL it tried to hit
    console.error("❌ AI Agent Error:", error.message);
    return null; 
  }
};

export default analyzeTicket;