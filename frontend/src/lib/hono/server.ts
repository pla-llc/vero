"use server";

import type { AppType } from "@backend/index";
import { hc } from "hono/client";
import { headers } from "next/headers";

export async function createApi() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return hc<AppType>(baseUrl, {
    fetch: async (url: URL | RequestInfo, options?: RequestInit) => {
      const h = await headers();

      const newHeaders = new Headers();
      for (const [key, value] of h.entries()) {
        newHeaders.append(key, value);
      }

      if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          if (!h.has(key)) {
            newHeaders.append(key, value);
          }
        }
      }

      return fetch(url, {
        ...options,
        headers: newHeaders,
      });
    },
  }).index;
}
