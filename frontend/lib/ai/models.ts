// Curated list of top models from Vercel AI Gateway
export const DEFAULT_CHAT_MODEL = "kimi-k2.5";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
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
