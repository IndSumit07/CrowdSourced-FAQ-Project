/**
 * AIProvider — abstract interface that all AI providers must implement.
 * Enables hot-swapping between Gemini and OpenAI via env variable.
 */
export class AIProvider {
  /**
   * Generate a text embedding vector for the given input.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    throw new Error("generateEmbedding() must be implemented by provider");
  }

  /**
   * Generate a chat completion response.
   * @param {string} systemPrompt
   * @param {string} userMessage
   * @returns {Promise<string>}
   */
  async generateText(systemPrompt, userMessage) {
    throw new Error("generateText() must be implemented by provider");
  }

  /**
   * Provider name identifier.
   * @returns {string}
   */
  get name() {
    throw new Error("name getter must be implemented by provider");
  }
}
