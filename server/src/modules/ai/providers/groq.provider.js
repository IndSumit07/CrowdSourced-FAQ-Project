import OpenAI from "openai";
import { AIProvider } from "./ai.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { ServiceUnavailableError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

export class GroqProvider extends AIProvider {
  #client;

  constructor() {
    super();
    if (!aiConfig.groq.apiKey) {
      throw new Error("GROQ_API_KEY is required when using Groq provider");
    }
    this.#client = new OpenAI({
      apiKey: aiConfig.groq.apiKey,
      baseURL: aiConfig.groq.baseUrl || "https://api.groq.com/openai/v1",
    });
  }

  get name() {
    return "groq";
  }

  async generateEmbedding(text) {
    logger.warn({ msg: "Groq does not support embeddings, falling back to Jina" });
    return [];
  }

  async generateText(systemPrompt, userMessage) {
    try {
      const response = await this.#client.chat.completions.create({
        model: aiConfig.groq.chatModel,
        temperature: aiConfig.groq.temperature,
        max_tokens: aiConfig.groq.maxOutputTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });
      return response.choices[0]?.message?.content || "";
    } catch (err) {
      logger.error({ msg: "Groq text generation failed", err: err.message });
      throw new ServiceUnavailableError("Text generation failed");
    }
  }
}
