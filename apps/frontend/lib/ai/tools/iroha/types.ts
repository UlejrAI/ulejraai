export interface IrohaToolContext {
  authToken: string;
}

export interface IrohaError {
  error: string;
  code?: string;
}

export type IrohaToolResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
