import type { IrohaToolResult } from "./types";

export async function parseIrohaResponse<T>(
  response: Response
): Promise<IrohaToolResult<T>> {
  try {
    const json = await response.json();

    if (response.ok && json.success) {
      return { success: true, data: json.data };
    }

    const errorMessage =
      typeof json.error === "string" ? json.error : JSON.stringify(json.error);

    return { success: false, error: errorMessage };
  } catch {
    return {
      success: false,
      error: "Failed to parse response from Iroha service",
    };
  }
}

export function createIrohaError(message: string): IrohaToolResult {
  return { success: false, error: message };
}

export function createIrohaSuccess<T>(data: T): IrohaToolResult<T> {
  return { success: true, data };
}
