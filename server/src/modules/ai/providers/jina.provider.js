import { AIProvider } from "./ai.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { ServiceUnavailableError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

export class JinaProvider extends AIProvider {
  #apiKey;
  #model;
  #baseUrl;

  constructor() {
    super();
    if (!aiConfig.jina.apiKey) {
      throw new Error("JINA_API_KEY is required when using Jina provider");
    }
    this.#apiKey = aiConfig.jina.apiKey;
    this.#model = aiConfig.jina.embeddingModel;
    this.#baseUrl = aiConfig.jina.baseUrl;
  }

  get name() {
    return "jina";
  }

  async generateEmbedding(text) {
    try {
      const response = await fetch(`${this.#baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify({
          model: this.#model,
          input: [text],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({
          msg: "Jina embedding failed",
          status: response.status,
          errorText,
        });
        throw new ServiceUnavailableError("Embedding generation failed");
      }

      const data = await response.json();
      const embedding = data?.data?.[0]?.embedding;

      if (!Array.isArray(embedding)) {
        logger.error({
          msg: "Jina embedding missing",
          keys: Object.keys(data || {}),
        });
        throw new ServiceUnavailableError("Embedding generation failed");
      }

      return embedding;
    } catch (err) {
      logger.error({ msg: "Jina embedding failed", err: err.message });
      throw new ServiceUnavailableError("Embedding generation failed");
    }
  }

  async generateText() {
    throw new ServiceUnavailableError(
      "Text generation is not configured for Jina",
    );
  }
}
