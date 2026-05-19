import { GoogleGenerativeAI } from "@google/generative-ai";

const analyzeTicket = async (ticket) => {
  console.log("🤖 AI Agent: Connecting to Gemini 2.5 Flash (Stable V1)...");
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // This is the CRITICAL fix for 2026:
    // We use gemini-3-flash and FORCE the apiVersion to 'v1'
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" }, 
      { apiVersion: "v1" } 
    ); 

    const prompt = `
      You are an expert IT assistant. Analyze this ticket and provide a strictly formatted JSON object.
      Title: ${ticket.title}
      Description: ${ticket.description}
      
      Respond ONLY with this JSON structure:
      {
        "summary": "Short 1-2 sentence summary",
        "priority": "low, medium, or high",
        "helpfulNotes": "Technical advice for the developer OR the complete solution for the user",
        "relatedSkills": ["React", "Node.js"],
        "isAutoResolvable": false // Set to true ONLY if this is a simple question or request you can fully answer in helpfulNotes without a human agent.
      }
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