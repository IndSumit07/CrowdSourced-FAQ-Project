import { env } from "./env.config.js";

export const aiConfig = Object.freeze({
  provider: env.AI_PROVIDER,
  gemini: {
    apiKey: env.GEMINI_API_KEY,
    embeddingModel: env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
    chatModel: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    temperature: 0.3,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
    embeddingModel: "text-embedding-3-small",
    chatModel: "gpt-4o-mini",
    maxOutputTokens: 2048,
    temperature: 0.3,
  },
  bedrock: {
    region: env.BEDROCK_REGION || env.AWS_REGION,
    embeddingModel: env.BEDROCK_EMBEDDING_MODEL || "amazon.titan-embed-text-v2",
    profile: env.AWS_PROFILE,
  },
  jina: {
    apiKey: env.JINA_API_KEY,
    embeddingModel: env.JINA_EMBEDDING_MODEL || "jina-embeddings-v3",
    baseUrl: env.JINA_BASE_URL || "https://api.jina.ai/v1",
  },
  groq: {
    apiKey: env.GROQ_API_KEY,
    chatModel: env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
    baseUrl: env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    maxOutputTokens: 2048,
    temperature: 0.3,
  },
  vectorSearch: {
    indexName: env.VECTOR_SEARCH_INDEX,
    dimensions: env.EMBEDDING_DIMENSIONS,
    similarityThreshold: env.VECTOR_SIMILARITY_THRESHOLD,
    numCandidates: 100,
    limit: 5,
  },
  allowedDomains: [
    "internships",
    "placements",
    "resume",
    "dsa",
    "data structures",
    "algorithms",
    "coding interviews",
    "career guidance",
    "job applications",
    "campus recruitment",
    "technical interviews",
    "off-campus",
  ],
});
