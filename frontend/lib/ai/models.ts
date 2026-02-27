// Curated list of top models from Vercel AI Gateway
export const DEFAULT_CHAT_MODEL = "auto";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "auto",
    name: "Auto (RouteLLM)",
    provider: "routellm",
    description:
      "Automatically routes each query to the best model based on complexity — saves cost while maintaining quality",
  },
  {
    id: "kimi-k2.5",
    name: "Kimi K2.5",
    provider: "moonshotai",
    description:
      "Strong model for complex analysis, deep research and reasoning",
  },
  {
    id: "kimi-k2-turbo-preview",
    name: "Kimi K2 Turbo",
    provider: "moonshotai",
    description: "Fast and affordable, great for everyday tasks",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
