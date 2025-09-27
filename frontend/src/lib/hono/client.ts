import type { AppType } from "@backend/index";
import { hc } from "hono/client";

export function createClientApi() {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
	return hc<AppType>(apiUrl).api;
}
