import OpenAI from "openai";
import { AIProvider } from "./ai.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { ServiceUnavailableError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

export class OpenRouterProvider extends AIProvider {
  #client;

  constructor() {
    super();
    if (!aiConfig.openrouter.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required when using OpenRouter provider");
    }
    this.#client = new OpenAI({
      apiKey: aiConfig.openrouter.apiKey,
      baseURL: aiConfig.openrouter.baseUrl || "https://openrouter.ai/api/v1",
    });
  }

  get name() {
    return "openrouter";
  }

  async generateEmbedding(text) {
    logger.warn({ msg: "OpenRouter does not support embeddings, falling back to Jina" });
    return [];
  }

  async generateText(systemPrompt, userMessage) {
    try {
      const response = await this.#client.chat.completions.create({
        model: aiConfig.openrouter.chatModel,
        temperature: aiConfig.openrouter.temperature,
        max_tokens: aiConfig.openrouter.maxOutputTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });
      return response.choices[0]?.message?.content || "";
    } catch (err) {
      logger.error({ msg: "OpenRouter text generation failed", err: err.message });
      throw new ServiceUnavailableError("Text generation failed");
    }
  }
}