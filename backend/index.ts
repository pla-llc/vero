import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { auth } from "./lib/auth";
import { createHono } from "./lib/hono";

dotenv.config();

const app = createHono().basePath("/api").use("*", async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

serve({
  fetch: app.fetch,
  port: 3001,
}).on("listening", () => {
  console.log("Server is running on port 3001");
});

export type AppType = typeof app;
