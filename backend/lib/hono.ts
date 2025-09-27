import { Hono } from "hono";
import { auth } from "./auth";

export function createHono() {
	return new Hono<{
		Variables: {
			user: typeof auth.$Infer.Session.user | null;
			session: typeof auth.$Infer.Session.session | null;
		};
	}>();
}