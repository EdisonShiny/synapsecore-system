import type { AiOutput } from "./types";

export interface ApiSuccess<TData extends object> {
  success: true;
  message: string;
  data: TData;
}

export interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

export type ApiResponse<TData extends object> = ApiSuccess<TData> | ApiError;

export function wrapAiSuccess<TOutput extends AiOutput>(
  data: TOutput,
  message = "AI output generated successfully"
): ApiSuccess<TOutput> {
  return {
    success: true,
    message,
    data
  };
}

export function wrapAiError(message: string, errors: string[]): ApiError {
  return {
    success: false,
    message,
    errors
  };
}
