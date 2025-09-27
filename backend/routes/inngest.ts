import { helloWorld } from "../inngest/functions";
import { inngest } from "../inngest/inngest";
import { createHono } from "../lib/hono";

export const inngestRoutes = createHono().on(
	["GET", "POST", "PUT"],
	"/",
	(c) => {
		return c.json({
			client: inngest,
			functions: [helloWorld],
		});
	}
);
