import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { cookies } from "next/headers";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { MCPManager } from "@/lib/ai/mcp";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { createInvoice } from "@/lib/ai/tools/invoice";
import {
  exchangeAsset,
  getBalance,
  getCompanies,
  getContactInfo,
  getNotifications,
  getRequestDetails,
  getTransferRequests,
  getUserInfo,
  getWalletInfo,
  markNotificationRead,
  setBalance,
  transferFunds,
  updateContactInfo,
} from "@/lib/ai/tools/iroha";
import { getActiveTools } from "@/lib/ai/tools/iroha/activator";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { getAuthUser, isGuestUser } from "@/lib/auth/session";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createGuestUser,
  createStreamId,
  deleteChatById,
  ensureWalletUser,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getUserById,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import type { User, UserType } from "@/lib/types/auth";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

async function getOrCreateGuestUser(): Promise<User> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (guestId) {
    const existingUser = await getUserById(guestId);
    if (existingUser) {
      return {
        id: existingUser.id,
        type: "guest",
      };
    }
  }

  const newGuest = await createGuestUser();
  const newUser = newGuest[0];

  cookieStore.set("guest_id", newUser.id, {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return {
    id: newUser.id,
    type: "guest",
  };
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    let user = await getAuthUser();

    if (!user) {
      user = await getOrCreateGuestUser();
    }

    const userType: UserType = user.type;

    if (user.type === "wallet") {
      try {
        await ensureWalletUser(user.id);
      } catch (err) {
        console.error("ensureWalletUser failed:", err);
      }
    }

    let messageCount = 0;
    if (!isGuestUser(user)) {
      messageCount = await getMessageCountByUserId({
        id: user.id,
        differenceInHours: 24,
      });

      if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
        return new ChatSDKError("rate_limit:chat").toResponse();
      }
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes("reasoning") ||
      selectedChatModel.includes("thinking");

    const rawModelMessages = await convertToModelMessages(uiMessages);

    // Filter out assistant messages with empty content, as some providers
    // (e.g. Moonshot AI) reject them with "must not be empty" errors.
    const modelMessages = rawModelMessages.filter((m) => {
      if (m.role !== "assistant") return true;
      if (typeof m.content === "string") return m.content.length > 0;
      if (Array.isArray(m.content)) return m.content.length > 0;
      return true;
    });

    const lastUserMessage = modelMessages
      .filter((m) => m.role === "user")
      .pop();
    const messageText =
      typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : Array.isArray(lastUserMessage?.content)
          ? (lastUserMessage.content as Array<{ type: string; text?: string }>)
              .filter((p) => p.type === "text")
              .map((p) => p.text ?? "")
              .join(" ")
          : "";

    const activeToolNames = isReasoningModel
      ? []
      : getActiveTools(
          {
            getBalance,
            getWalletInfo,
            getNotifications,
            markNotificationRead,
            getTransferRequests,
            getRequestDetails,
            getUserInfo,
            getContactInfo,
            updateContactInfo,
            getCompanies,
            transferFunds,
            exchangeAsset,
            setBalance,
          },
          messageText
        );

    // Create MCP Manager for this conversation
    const mcpManager = new MCPManager({ conversationId: id });

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        // Get MCP tools from all configured servers
        const { tools: mcpTools, failedServers } = await mcpManager.getTools();

        if (failedServers.length > 0) {
          console.log(`MCP servers unavailable: ${failedServers.join(", ")}`);
        }

        if (Object.keys(mcpTools).length > 0) {
          console.log(`MCP tools loaded: ${Object.keys(mcpTools).join(", ")}`);
        }

        const mcpToolNames = Object.keys(mcpTools);
        const coreToolNames = [
          "getWeather",
          "createDocument",
          "createInvoice",
          "updateDocument",
          "requestSuggestions",
        ];
        const allActiveToolNames = [
          ...activeToolNames,
          ...mcpToolNames,
          ...coreToolNames,
        ];

        const result = streamText({
          model: await getLanguageModel(selectedChatModel, messageText),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages,
          stopWhen: stepCountIs(15),
          experimental_activeTools: allActiveToolNames as any,
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools: {
            ...mcpTools,
            getWeather,
            createDocument: createDocument({ user, dataStream }),
            createInvoice: createInvoice({ user, dataStream }),
            updateDocument: updateDocument({ user, dataStream }),
            requestSuggestions: requestSuggestions({ user, dataStream }),
            // Iroha tools
            getBalance,
            getWalletInfo,
            getNotifications,
            markNotificationRead,
            getTransferRequests,
            getRequestDetails,
            getUserInfo,
            getContactInfo,
            updateContactInfo,
            getCompanies,
            transferFunds,
            exchangeAsset,
            setBalance,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }

        // Cleanup MCP connections after stream is done
        try {
          await mcpManager.cleanup();
        } catch (error) {
          console.error("Failed to cleanup MCP manager:", error);
        }
      },
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const user = await getAuthUser();

  if (!user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
