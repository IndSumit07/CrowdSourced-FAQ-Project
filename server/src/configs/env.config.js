import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  // Redis settings are currently disabled; kept optional for future re-enable
  UPSTASH_REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_HOST: z.string().optional(),
  UPSTASH_REDIS_PORT: z.coerce.number().int().positive().default(6379),
  UPSTASH_REDIS_PASSWORD: z.string().optional(),

  CORS_ORIGIN: z.string().optional(),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  AI_PROVIDER: z
    .enum(["gemini", "openai", "bedrock", "jina", "openrouter"])
    .default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_EMBEDDING_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_CHAT_MODEL: z.string().optional(),
  BEDROCK_REGION: z.string().optional(),
  BEDROCK_EMBEDDING_MODEL: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_PROFILE: z.string().optional(),
  JINA_API_KEY: z.string().optional(),
  JINA_EMBEDDING_MODEL: z.string().optional(),
  JINA_BASE_URL: z.string().optional(),

  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(768),
  VECTOR_SEARCH_INDEX: z.string().default("faq_vector_index"),
  VECTOR_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.82),

  QUERY_DEADLINE_HOURS: z.coerce.number().positive().default(1),
  MIN_CONTRIBUTOR_RESPONSES: z.coerce.number().int().positive().default(2),
  FLAG_THRESHOLD: z.coerce.number().int().positive().default(5),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_PUBLIC: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_MAX_AUTH: z.coerce.number().int().positive().default(200),
  RATE_LIMIT_MAX_AI: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`❌ Invalid environment variables:\n${issues}`);
}

export const env = Object.freeze(parsed.data);
