import { callAIAssistant } from "@/api/aiAssistantService";

// Este arquivo seria usado em um backend Node.js/Express
// Para o frontend, vamos criar uma versão que funciona com a API OpenAI diretamente

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, systemData, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await callAIAssistant({
      message,
      systemData,
      conversationHistory: conversationHistory || [],
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in AI assistant API:", error);
    return res.status(500).json({
      error: "Failed to process AI assistant request",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
