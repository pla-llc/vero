import { auth } from "../lib/auth";
import { createHono } from "../lib/hono";

const app = createHono()
	.on(["POST", "GET"], "/*", (c) => {
		return auth.handler(c.req.raw);
	});

export default app;