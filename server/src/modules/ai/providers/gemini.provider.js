import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider } from "./ai.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { ServiceUnavailableError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

export class GeminiProvider extends AIProvider {
  #client;
  #embeddingModel;
  #chatModel;

  constructor() {
    super();
    if (!aiConfig.gemini.apiKey) {
      throw new Error("GEMINI_API_KEY is required when using Gemini provider");
    }
    this.#client = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
    this.#embeddingModel = aiConfig.gemini.embeddingModel;
    this.#chatModel = aiConfig.gemini.chatModel;
  }

  get name() {
    return "gemini";
  }

  async generateEmbedding(text) {
    try {
      const model = this.#client.getGenerativeModel({ model: this.#embeddingModel });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err) {
      logger.error({ msg: "Gemini embedding failed", err: err.message });
      throw new ServiceUnavailableError("Embedding generation failed");
    }
  }

  async generateText(systemPrompt, userMessage) {
    try {
      const model = this.#client.getGenerativeModel({
        model: this.#chatModel,
        generationConfig: {
          maxOutputTokens: aiConfig.gemini.maxOutputTokens,
          temperature: aiConfig.gemini.temperature,
        },
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent(userMessage);
      const response = result.response;
      return response.text();
    } catch (err) {
      logger.error({ msg: "Gemini text generation failed", err: err.message });
      throw new ServiceUnavailableError("Text generation failed");
    }
  }
}
