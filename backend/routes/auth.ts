import { cors } from "hono/cors";
import { auth } from "../lib/auth";
import { createHono } from "../lib/hono";

const app = createHono()
	.use("/*", cors({
		origin: "http://localhost:3000",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}))
	.on(["POST", "GET"], "/*", (c) => {
		return auth.handler(c.req.raw);
	});

export default app;