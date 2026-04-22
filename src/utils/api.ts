import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/types";

export function ok<T>(message: string, data: T, init?: ResponseInit) {
  const body: ApiSuccess<T> = {
    success: true,
    message,
    data
  };

  return NextResponse.json(body, init);
}

export function fail(message: string, errors: string[], status = 400) {
  const body: ApiError = {
    success: false,
    message,
    errors
  };

  return NextResponse.json(body, { status });
}
