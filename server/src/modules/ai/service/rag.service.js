import OpenAI from "openai";
import { aiConfig } from "../../../configs/ai.config.js";
import { logger } from "../../../utils/logger.js";

const RAG_SYSTEM_PROMPT = `You are a helpful AI assistant for an internship and career guidance platform.

You will be given a user's question and a set of relevant FAQ entries retrieved from our knowledge base.

Your task is to synthesize a clear, accurate, and helpful answer based ONLY on the retrieved FAQ context provided.

FORMATTING RULES — strictly follow these:
1. Write in plain text only. No markdown whatsoever.
2. Do NOT use asterisks (*), double asterisks (**), underscores (_), pound signs (#), backticks (\`), tildes (~), or any other markdown syntax.
3. Do NOT bold, italicize, or use any special formatting characters.
4. Use plain numbered lists (1. 2. 3.) or plain dashes (-) for bullet points if needed.
5. No code blocks, no JSON, no headers.

CONTENT RULES:
6. Base your answer strictly on the provided FAQ context — do not fabricate information.
7. If the context is insufficient, say so honestly and suggest submitting the query for expert contributors.
8. Write in a friendly, professional tone suitable for students and job seekers.
9. Keep the answer concise but comprehensive (150-350 words).
10. Start directly with the answer, do not repeat the question.`;

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Generates AI answers grounded in retrieved FAQ context using Groq.
 */
export class RAGService {
  #client;

  constructor() {
    if (!aiConfig.groq.apiKey) {
      throw new Error("GROQ_API_KEY is required for RAG service");
    }
    this.#client = new OpenAI({
      apiKey: aiConfig.groq.apiKey,
      baseURL: aiConfig.groq.baseUrl || "https://api.groq.com/openai/v1",
    });
  }

  /**
   * Generates a RAG answer from the user's question and retrieved FAQ context.
   * @param {string} question - The user's question
   * @param {Array<{title: string, answer: string, category?: string}>} faqs - Retrieved FAQ entries
   * @returns {Promise<string>} AI-generated answer grounded in context
   */
  async generateAnswer(question, faqs) {
    try {
      // Build context block from retrieved FAQs
      const contextBlock =
        faqs.length > 0
          ? faqs
              .map(
                (faq, i) =>
                  `[FAQ ${i + 1}]\nTitle: ${faq.title}\nAnswer: ${faq.answer}`
              )
              .join("\n\n---\n\n")
          : "No directly matching FAQ entries were found in our knowledge base.";

      const userMessage = `User Question: "${question}"

Retrieved FAQ Context:
${contextBlock}

Please provide a helpful answer based on the above context.`;

      const response = await this.#client.chat.completions.create({
        model: aiConfig.groq.chatModel,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: "system", content: RAG_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const raw = response.choices[0]?.message?.content || "";

      // Strip any markdown special characters that slipped through despite the prompt
      const answer = raw
        .replace(/\*\*/g, "")   // bold **text**
        .replace(/\*/g, "")     // italic *text* or stray asterisks
        .replace(/_{1,2}/g, "") // italic/bold _text_ __text__
        .replace(/~~([^~]*)~~/g, "$1") // strikethrough ~~text~~
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, "")) // inline/block code
        .replace(/^#{1,6}\s+/gm, "") // headings # ## ###
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links [text](url) → text
        .replace(/^>\s+/gm, "")  // blockquotes
        .trim();

      logger.debug({
        msg: "RAG answer generated",
        question: question.slice(0, 80),
        contextFAQs: faqs.length,
        answerLength: answer.length,
      });

      return answer;
    } catch (err) {
      logger.error({ msg: "RAG generation failed", err: err.message });
      throw err;
    }
  }
}
