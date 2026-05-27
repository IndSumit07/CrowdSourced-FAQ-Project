import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { AIProvider } from "./ai.provider.js";
import { aiConfig } from "../../../configs/ai.config.js";
import { ServiceUnavailableError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";

const decodeBody = (body) => {
  if (!body) return null;
  if (typeof body === "string") return body;
  const decoder = new TextDecoder();
  return decoder.decode(body);
};

const extractEmbedding = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload.embedding)) return payload.embedding;
  if (Array.isArray(payload.embeddings)) {
    const first = payload.embeddings[0];
    if (Array.isArray(first)) return first;
    if (first && Array.isArray(first.embedding)) return first.embedding;
  }
  return null;
};

export class BedrockProvider extends AIProvider {
  #client;
  #embeddingModel;

  constructor() {
    super();
    if (!aiConfig.bedrock.region) {
      throw new Error(
        "BEDROCK_REGION (or AWS_REGION) is required when using Bedrock provider",
      );
    }
    this.#client = new BedrockRuntimeClient({
      region: aiConfig.bedrock.region,
    });
    this.#embeddingModel = aiConfig.bedrock.embeddingModel;
  }

  get name() {
    return "bedrock";
  }

  async generateEmbedding(text) {
    try {
      const command = new InvokeModelCommand({
        modelId: this.#embeddingModel,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ inputText: text }),
      });

      const response = await this.#client.send(command);
      const payloadText = decodeBody(response.body);
      const payload = payloadText ? JSON.parse(payloadText) : null;
      const embedding = extractEmbedding(payload);

      if (!embedding) {
        logger.error({
          msg: "Bedrock embedding missing",
          payloadKeys: payload ? Object.keys(payload) : [],
        });
        throw new ServiceUnavailableError("Embedding generation failed");
      }

      return embedding;
    } catch (err) {
      logger.error({ msg: "Bedrock embedding failed", err: err.message });
      throw new ServiceUnavailableError("Embedding generation failed");
    }
  }

  async generateText() {
    throw new ServiceUnavailableError(
      "Text generation is not configured for Bedrock",
    );
  }
}
