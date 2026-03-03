import { moonshotai } from "@ai-sdk/moonshotai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import { AUTO_ROUTER_MODEL, routeModel } from "./router";

const THINKING_SUFFIX_REGEX = /-thinking$/;

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

export async function getLanguageModel(modelId: string, prompt?: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(
      modelId === AUTO_ROUTER_MODEL ? "chat-model" : modelId
    );
  }

  // LLMRouter: async routing via microservice
  if (modelId === AUTO_ROUTER_MODEL) {
    const {
      modelId: routedModelId,
      routedTo,
      source,
    } = await routeModel(prompt ?? "");

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[LLMRouter] "${prompt && prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt}" → ${routedTo} (${routedModelId}) via ${source}`
      );
    }

    return moonshotai(routedModelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const baseModelId = modelId.replace(THINKING_SUFFIX_REGEX, "");
    return wrapLanguageModel({
      model: moonshotai(baseModelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return moonshotai(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return moonshotai("kimi-k2.5");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return moonshotai("kimi-k2.5");
}
