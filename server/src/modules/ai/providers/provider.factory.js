import { aiConfig } from "../../../configs/ai.config.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OpenAIProvider } from "./openai.provider.js";
import { BedrockProvider } from "./bedrock.provider.js";
import { JinaProvider } from "./jina.provider.js";
import { OpenRouterProvider } from "./openrouter.provider.js";
import { logger } from "../../../utils/logger.js";

let _provider = null;

/**
 * Returns the singleton AI provider instance.
 * Provider is determined by AI_PROVIDER env variable.
 */
export const getAIProvider = () => {
  if (_provider) return _provider;

  const providerName = aiConfig.provider;

  switch (providerName) {
    case "gemini":
      _provider = new GeminiProvider();
      break;
    case "openai":
      _provider = new OpenAIProvider();
      break;
    case "bedrock":
      _provider = new BedrockProvider();
      break;
    case "jina":
      _provider = new JinaProvider();
      break;
    case "openrouter":
      _provider = new OpenRouterProvider();
      break;
    default:
      throw new Error(
        `Unknown AI provider: ${providerName}. Use 'gemini', 'openai', 'bedrock', 'jina', or 'openrouter'.`,
      );
  }

  logger.info({ msg: "AI provider initialized", provider: _provider.name });
  return _provider;
};
