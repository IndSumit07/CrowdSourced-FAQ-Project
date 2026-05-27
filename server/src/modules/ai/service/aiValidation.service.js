import { getAIProvider } from "../providers/provider.factory.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { logger } from "../../../utils/logger.js";

const VALIDATION_SYSTEM_PROMPT = `You are an intelligent content moderator for an internship and career Q&A platform.

Your task is to classify whether a user's question is RELEVANT or IRRELEVANT to the platform's allowed domains.

Allowed domains:
${aiConfig.allowedDomains.map((d) => `- ${d}`).join("\n")}

Rules:
1. Answer ONLY with a JSON object: { "relevant": true/false, "confidence": 0.0-1.0, "reason": "brief explanation", "category": "domain category" }
2. Be generous — borderline cases should be marked relevant.
3. Completely off-topic questions (gaming, cooking, relationships, medical) should be marked irrelevant.
4. Return valid JSON only, no markdown.`;

const SUMMARIZATION_SYSTEM_PROMPT = `You are an expert technical writer specializing in internship and career guidance.

Your task is to synthesize multiple contributor answers into a single, clear, authoritative FAQ answer.

Rules:
1. Remove duplicate information.
2. Preserve unique insights from different contributors.
3. Write in clear, professional language.
4. Be concise but comprehensive.
5. Format with proper structure if needed.
6. Return only the final synthesized answer text.`;

const FAQ_DRAFT_SYSTEM_PROMPT = `You are an expert FAQ curator for an internship and career guidance platform.

Given a question and a synthesized answer, create a polished FAQ entry.

Return ONLY valid JSON with this structure:
{
  "title": "Well-phrased FAQ question title",
  "answer": "Comprehensive, well-formatted answer",
  "category": "internship|placement|resume|dsa|coding-interview|career",
  "tags": ["tag1", "tag2", "tag3"]
}`;

export class AIValidationService {
  #provider;

  constructor() {
    this.#provider = getAIProvider();
  }

  /**
   * Validates whether a question is relevant to allowed domains.
   * @returns {{ relevant: boolean, confidence: number, reason: string, category: string }}
   */
  async validateRelevance(question) {
    try {
      const raw = await this.#provider.generateText(
        VALIDATION_SYSTEM_PROMPT,
        `Question: "${question}"`
      );

      const cleaned = raw.trim().replace(/```json|```/g, "").trim();
      const result = JSON.parse(cleaned);

      logger.debug({
        msg: "Relevance validation",
        question: question.slice(0, 80),
        result,
      });

      return {
        relevant: Boolean(result.relevant),
        confidence: parseFloat(result.confidence) || 0,
        reason: result.reason || "",
        category: result.category || "general",
      };
    } catch (err) {
      logger.warn({ msg: "Relevance validation failed, defaulting to relevant", err: err.message });
      // Fail open — don't block users on AI failures
      return { relevant: true, confidence: 0.5, reason: "Validation unavailable", category: "general" };
    }
  }

  /**
   * Summarizes multiple contributor answers into a single coherent answer.
   * @param {string} question
   * @param {string[]} answers
   * @returns {Promise<string>}
   */
  async summarizeAnswers(question, answers) {
    const answersText = answers
      .map((a, i) => `Contributor ${i + 1}: ${a}`)
      .join("\n\n");

    const userMessage = `Question: "${question}"\n\nContributor Answers:\n${answersText}`;

    return this.#provider.generateText(SUMMARIZATION_SYSTEM_PROMPT, userMessage);
  }

  /**
   * Drafts a polished FAQ entry from a question and synthesized answer.
   * @returns {{ title, answer, category, tags }}
   */
  async draftFAQ(question, synthesizedAnswer) {
    try {
      const userMessage = `Question: "${question}"\n\nSynthesized Answer: "${synthesizedAnswer}"`;
      const raw = await this.#provider.generateText(FAQ_DRAFT_SYSTEM_PROMPT, userMessage);
      const cleaned = raw.trim().replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      logger.warn({ msg: "FAQ drafting failed", err: err.message });
      // Fallback draft
      return {
        title: question,
        answer: synthesizedAnswer,
        category: "general",
        tags: [],
      };
    }
  }
}
