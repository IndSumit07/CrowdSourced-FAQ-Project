import OpenAI from "openai";
import { AIProvider } from "./ai.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { ServiceUnavailableError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

export class OpenAIProvider extends AIProvider {
  #client;

  constructor() {
    super();
    if (!aiConfig.openai.apiKey) {
      throw new Error("OPENAI_API_KEY is required when using OpenAI provider");
    }
    this.#client = new OpenAI({ apiKey: aiConfig.openai.apiKey });
  }

  get name() {
    return "openai";
  }

  async generateEmbedding(text) {
    try {
      const response = await this.#client.embeddings.create({
        model: aiConfig.openai.embeddingModel,
        input: text,
        encoding_format: "float",
      });
      return response.data[0].embedding;
    } catch (err) {
      logger.error({ msg: "OpenAI embedding failed", err: err.message });
      throw new ServiceUnavailableError("Embedding generation failed");
    }
  }

  async generateText(systemPrompt, userMessage) {
    try {
      const response = await this.#client.chat.completions.create({
        model: aiConfig.openai.chatModel,
        temperature: aiConfig.openai.temperature,
        max_tokens: aiConfig.openai.maxOutputTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });
      return response.choices[0]?.message?.content || "";
    } catch (err) {
      logger.error({ msg: "OpenAI text generation failed", err: err.message });
      throw new ServiceUnavailableError("Text generation failed");
    }
  }
}
