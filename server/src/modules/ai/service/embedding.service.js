import { getAIProvider } from "../providers/provider.factory.js";
import { JinaProvider } from "../providers/jina.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { cacheGet, cacheSet } from "../../../utils/cache.js";
import { logger } from "../../../utils/logger.js";

/**
 * Generates and caches embeddings for input text.
 * Cache key: sha256 hash of normalized text to avoid redundant API calls.
 */
export class EmbeddingService {
  #provider;
  #embeddingProvider;

  constructor() {
    this.#provider = getAIProvider();
    const mainProviderName = aiConfig.provider;
    const needsEmbeddingFallback = mainProviderName === "groq" || mainProviderName === "bedrock";
    const hasJinaKey = Boolean(aiConfig.jina?.apiKey);
    if (needsEmbeddingFallback && hasJinaKey) {
      this.#embeddingProvider = new JinaProvider();
    }
  }

  async #getEmbeddingProvider() {
    if (this.#embeddingProvider) return this.#embeddingProvider;
    return this.#provider;
  }

  /**
   * Normalizes text for consistent caching.
   */
  #normalizeText(text) {
    return text.toLowerCase().trim().replace(/\s+/g, " ");
  }

  /**
   * Generates an embedding, with Redis semantic cache.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embed(text) {
    const normalized = this.#normalizeText(text);
    const cacheKey = `embed:${Buffer.from(normalized).toString("base64").slice(0, 64)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug({ msg: "Embedding cache hit" });
      return cached;
    }

    const embeddingProvider = await this.#getEmbeddingProvider();
    const embedding = await embeddingProvider.generateEmbedding(normalized);
    await cacheSet(cacheKey, embedding, 86400); // Cache 24h
    return embedding;
  }

  /**
   * Batch generates embeddings for an array of texts.
   */
  async embedBatch(texts) {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
